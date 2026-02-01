/**
 * Resource Manager for Private Mode.
 * Implements semaphore-based resource locking to prevent OOM on constrained hardware (e.g., 16GB NucBox).
 *
 * Problem: Without resource management, concurrent agent calls can spawn:
 * - 4 main agents + 8 subagents = 12 concurrent LLM calls
 * - Each local model (Qwen 2.5 7B) uses ~6GB RAM
 * - This would require ~72GB RAM, causing OOM on a 16GB system
 *
 * Solution: Semaphore-based locks that queue requests when resources are exhausted.
 */

import type { OpenClawConfig } from "../config/config.js";

export type ResourceType = "llm" | "vision" | "stt" | "tts";

type ResourceLock = {
  max: number;
  current: number;
  queue: Array<() => void>;
};

type ResourceLimits = {
  maxConcurrentLLM: number;
  maxConcurrentVision: number;
  maxConcurrentSTT: number;
  maxConcurrentTTS: number;
};

// Default limits for 16GB NucBox
const DEFAULT_LIMITS: ResourceLimits = {
  maxConcurrentLLM: 2,
  maxConcurrentVision: 1, // Vision is memory-heavy, only one at a time
  maxConcurrentSTT: 2,
  maxConcurrentTTS: 4, // TTS (Kokoro) is lightweight, can run more
};

// Global resource locks
const locks: Record<ResourceType, ResourceLock> = {
  llm: { max: DEFAULT_LIMITS.maxConcurrentLLM, current: 0, queue: [] },
  vision: { max: DEFAULT_LIMITS.maxConcurrentVision, current: 0, queue: [] },
  stt: { max: DEFAULT_LIMITS.maxConcurrentSTT, current: 0, queue: [] },
  tts: { max: DEFAULT_LIMITS.maxConcurrentTTS, current: 0, queue: [] },
};

/**
 * Configure resource limits from config.
 * Call this on startup or when config changes.
 */
export function configureResourceLimits(cfg: OpenClawConfig): void {
  const limits = cfg.privacy?.resourceLimits;
  if (!limits) {
    return;
  }

  if (typeof limits.maxConcurrentLLM === "number" && limits.maxConcurrentLLM > 0) {
    locks.llm.max = limits.maxConcurrentLLM;
  }
  if (typeof limits.maxConcurrentVision === "number" && limits.maxConcurrentVision > 0) {
    locks.vision.max = limits.maxConcurrentVision;
  }
  if (typeof limits.maxConcurrentSTT === "number" && limits.maxConcurrentSTT > 0) {
    locks.stt.max = limits.maxConcurrentSTT;
  }
  if (typeof limits.maxConcurrentTTS === "number" && limits.maxConcurrentTTS > 0) {
    locks.tts.max = limits.maxConcurrentTTS;
  }
}

/**
 * Reset resource limits to defaults.
 * Useful for testing or when switching profiles.
 */
export function resetResourceLimits(): void {
  locks.llm.max = DEFAULT_LIMITS.maxConcurrentLLM;
  locks.vision.max = DEFAULT_LIMITS.maxConcurrentVision;
  locks.stt.max = DEFAULT_LIMITS.maxConcurrentSTT;
  locks.tts.max = DEFAULT_LIMITS.maxConcurrentTTS;
}

/**
 * Get current resource usage statistics.
 */
export function getResourceStats(): Record<
  ResourceType,
  { current: number; max: number; queued: number }
> {
  return {
    llm: { current: locks.llm.current, max: locks.llm.max, queued: locks.llm.queue.length },
    vision: {
      current: locks.vision.current,
      max: locks.vision.max,
      queued: locks.vision.queue.length,
    },
    stt: { current: locks.stt.current, max: locks.stt.max, queued: locks.stt.queue.length },
    tts: { current: locks.tts.current, max: locks.tts.max, queued: locks.tts.queue.length },
  };
}

/**
 * Release a resource lock.
 * Called when the resource is no longer in use.
 */
function releaseResource(type: ResourceType): void {
  const lock = locks[type];
  lock.current = Math.max(0, lock.current - 1);

  // Process next item in queue if any
  if (lock.queue.length > 0) {
    const next = lock.queue.shift();
    if (next) {
      lock.current += 1;
      next();
    }
  }
}

/**
 * Acquire a resource lock.
 * Returns a release function that MUST be called when done.
 *
 * If the resource is at capacity, the request is queued and the promise
 * resolves when a slot becomes available.
 *
 * @param type - The resource type to acquire
 * @returns A release function to call when the resource is no longer needed
 *
 * @example
 * ```typescript
 * const release = await acquireResource("llm");
 * try {
 *   // Use the LLM
 *   await ollama.chat({ model: "qwen2.5-coder:7b", ... });
 * } finally {
 *   release();
 * }
 * ```
 */
export async function acquireResource(type: ResourceType): Promise<() => void> {
  const lock = locks[type];

  // If we have capacity, acquire immediately
  if (lock.current < lock.max) {
    lock.current += 1;
    return () => releaseResource(type);
  }

  // Otherwise, queue and wait
  return new Promise<() => void>((resolve) => {
    lock.queue.push(() => {
      resolve(() => releaseResource(type));
    });
  });
}

/**
 * Try to acquire a resource without waiting.
 * Returns null if the resource is at capacity.
 *
 * @param type - The resource type to acquire
 * @returns A release function, or null if resource unavailable
 */
export function tryAcquireResource(type: ResourceType): (() => void) | null {
  const lock = locks[type];

  if (lock.current < lock.max) {
    lock.current += 1;
    return () => releaseResource(type);
  }

  return null;
}

/**
 * Acquire a resource with timeout.
 * Throws if the resource cannot be acquired within the timeout.
 *
 * @param type - The resource type to acquire
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns A release function to call when the resource is no longer needed
 * @throws Error if timeout expires
 */
export async function acquireResourceWithTimeout(
  type: ResourceType,
  timeoutMs: number,
): Promise<() => void> {
  const lock = locks[type];

  // If we have capacity, acquire immediately
  if (lock.current < lock.max) {
    lock.current += 1;
    return () => releaseResource(type);
  }

  // Otherwise, queue with timeout
  return new Promise<() => void>((resolve, reject) => {
    let resolved = false;
    let queuedCallback: (() => void) | null = null;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // Remove from queue if still present
        if (queuedCallback) {
          const idx = lock.queue.indexOf(queuedCallback);
          if (idx !== -1) {
            lock.queue.splice(idx, 1);
          }
        }
        reject(new Error(`Resource acquisition timeout for ${type} after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    queuedCallback = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(() => releaseResource(type));
      }
    };

    lock.queue.push(queuedCallback);
  });
}

/**
 * Execute a function with a resource lock.
 * Automatically acquires and releases the resource.
 *
 * @param type - The resource type to acquire
 * @param fn - The function to execute with the resource
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const response = await withResource("llm", async () => {
 *   return ollama.chat({ model: "qwen2.5-coder:7b", ... });
 * });
 * ```
 */
export async function withResource<T>(type: ResourceType, fn: () => Promise<T>): Promise<T> {
  const release = await acquireResource(type);
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Execute a function with a resource lock and timeout.
 * Automatically acquires and releases the resource.
 *
 * @param type - The resource type to acquire
 * @param timeoutMs - Maximum time to wait for resource in milliseconds
 * @param fn - The function to execute with the resource
 * @returns The result of the function
 * @throws Error if timeout expires waiting for resource
 */
export async function withResourceTimeout<T>(
  type: ResourceType,
  timeoutMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const release = await acquireResourceWithTimeout(type, timeoutMs);
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Check if resource management should be enabled.
 * Only enabled when privacy.strictMode is true (Private Mode).
 */
export function shouldEnableResourceManagement(cfg: OpenClawConfig): boolean {
  return cfg.privacy?.strictMode === true;
}

/**
 * Reset all resource state.
 * Clears all locks and queues. For testing only.
 */
export function resetResourceStateForTest(): void {
  for (const type of Object.keys(locks) as ResourceType[]) {
    locks[type].current = 0;
    locks[type].queue = [];
  }
  resetResourceLimits();
}
