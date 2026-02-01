/**
 * Strict Mode (Private Mode) central enforcement.
 *
 * When privacy.strictMode is enabled, ALL external network calls are blocked.
 * This ensures 100% local operation for privacy-sensitive deployments.
 *
 * Usage:
 * - Call `isStrictModeEnabled()` before any external network request
 * - Call `assertNotStrictMode()` to throw if strict mode is active
 * - Use `guardedFetch()` as a drop-in replacement for fetch() that respects strict mode
 */

import type { OpenClawConfig } from "../config/config.js";

// Global config reference - set via setStrictModeConfig()
let globalConfig: OpenClawConfig | null = null;

/**
 * Set the global config reference for strict mode checks.
 * Call this during gateway startup with the loaded config.
 */
export function setStrictModeConfig(cfg: OpenClawConfig | null): void {
  globalConfig = cfg;
}

/**
 * Get the current global config reference.
 */
export function getStrictModeConfig(): OpenClawConfig | null {
  return globalConfig;
}

/**
 * Check if strict mode is enabled.
 * Returns true if privacy.strictMode is explicitly set to true.
 */
export function isStrictModeEnabled(cfg?: OpenClawConfig | null): boolean {
  const config = cfg ?? globalConfig;
  return config?.privacy?.strictMode === true;
}

/**
 * Assert that strict mode is NOT enabled.
 * Throws StrictModeError if strict mode is active.
 *
 * @param context - Description of what operation is being blocked
 * @param cfg - Optional config override (uses global config if not provided)
 */
export function assertNotStrictMode(context: string, cfg?: OpenClawConfig | null): void {
  if (isStrictModeEnabled(cfg)) {
    throw new StrictModeError(context);
  }
}

/**
 * Error thrown when an operation is blocked by strict mode.
 */
export class StrictModeError extends Error {
  public readonly isStrictModeError = true;

  constructor(public readonly context: string) {
    super(
      `[Strict Mode] ${context} is blocked in private mode. No external network calls allowed.`,
    );
    this.name = "StrictModeError";
  }
}

/**
 * Check if an error is a StrictModeError.
 */
export function isStrictModeError(error: unknown): error is StrictModeError {
  return (
    error instanceof StrictModeError ||
    (error !== null &&
      typeof error === "object" &&
      "isStrictModeError" in error &&
      (error as { isStrictModeError: unknown }).isStrictModeError === true)
  );
}

/**
 * Guarded fetch that blocks external requests in strict mode.
 * Use this as a drop-in replacement for fetch() in code paths that should respect strict mode.
 *
 * @param url - The URL to fetch
 * @param init - Fetch init options
 * @param cfg - Optional config override
 * @returns The fetch response
 * @throws StrictModeError if strict mode is enabled
 */
export async function guardedFetch(
  url: string | URL,
  init?: RequestInit,
  cfg?: OpenClawConfig | null,
): Promise<Response> {
  const urlString = url instanceof URL ? url.toString() : url;

  // Allow localhost/local network even in strict mode
  if (isLocalUrl(urlString)) {
    return fetch(url, init);
  }

  // Block external requests in strict mode
  assertNotStrictMode(`External fetch to ${new URL(urlString).hostname}`, cfg);

  return fetch(url, init);
}

/**
 * Check if a URL points to localhost or local network.
 * These are allowed even in strict mode (for Ollama, local services, etc.)
 */
export function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Localhost variants
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true;
    }

    // Local network (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) {
      return true;
    }
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    // .local domains (mDNS)
    if (hostname.endsWith(".local")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * List of known external endpoints that should be blocked in strict mode.
 * Used for documentation and audit purposes.
 */
export const BLOCKED_ENDPOINTS = [
  // Model discovery
  { pattern: "openrouter.ai", purpose: "Model discovery" },
  { pattern: "api.venice.ai", purpose: "Model discovery" },
  { pattern: "opencode.ai", purpose: "Model discovery" },

  // Provider usage monitoring
  { pattern: "api.anthropic.com", purpose: "Usage stats" },
  { pattern: "cloudcode-pa.googleapis.com", purpose: "Usage stats" },
  { pattern: "api.openai.com", purpose: "API calls" },

  // Web tools
  { pattern: "api.search.brave.com", purpose: "Web search" },

  // Package registry
  { pattern: "registry.npmjs.org", purpose: "Update checks" },
] as const;

/**
 * Log a strict mode block event for audit purposes.
 * This can be extended to write to an audit log file.
 */
export function logStrictModeBlock(context: string, url?: string): void {
  const message = url
    ? `[Strict Mode] Blocked: ${context} (${url})`
    : `[Strict Mode] Blocked: ${context}`;

  // For now, just log to console in debug scenarios
  // In production, this could write to an audit log
  if (process.env.DEBUG_STRICT_MODE === "1") {
    console.warn(message);
  }
}

/**
 * List of provider IDs that are considered "local" (no external network calls).
 * These providers are allowed in strict mode.
 */
export const LOCAL_PROVIDERS = new Set([
  "ollama",
  "local",
  "lmstudio",
  "llamacpp",
  "llama-cpp",
  "mlx",
  "exllama",
  "kobold",
  "jan",
  "gpt4all",
  "localai",
  "text-generation-inference",
  "tgi",
  "vllm",
  "tabby",
]);

/**
 * Check if a provider is considered "local" (doesn't require external network).
 * Local providers include Ollama, LM Studio, llama.cpp, etc.
 */
export function isLocalProvider(provider: string): boolean {
  const normalized = provider.trim().toLowerCase();
  return LOCAL_PROVIDERS.has(normalized);
}

/**
 * Check if a provider is allowed in strict mode.
 * Only local providers are allowed in strict mode.
 *
 * @param provider - Provider ID to check
 * @param cfg - Optional config override
 * @returns true if provider is allowed
 */
export function isProviderAllowedInStrictMode(
  provider: string,
  cfg?: OpenClawConfig | null,
): boolean {
  // If strict mode is not enabled, all providers are allowed
  if (!isStrictModeEnabled(cfg)) {
    return true;
  }
  // In strict mode, only local providers are allowed
  return isLocalProvider(provider);
}

/**
 * Assert that a provider is allowed in strict mode.
 * Throws StrictModeError if provider is not local and strict mode is active.
 *
 * @param provider - Provider ID to check
 * @param cfg - Optional config override
 */
export function assertProviderAllowed(provider: string, cfg?: OpenClawConfig | null): void {
  if (!isProviderAllowedInStrictMode(provider, cfg)) {
    throw new StrictModeError(
      `Cloud provider "${provider}" is not allowed in private mode. Use a local provider like "ollama" instead.`,
    );
  }
}

/**
 * Filter a list of model refs to only include those allowed in strict mode.
 * Returns all models if strict mode is disabled, only local provider models otherwise.
 */
export function filterModelsForStrictMode<T extends { provider: string }>(
  models: T[],
  cfg?: OpenClawConfig | null,
): T[] {
  if (!isStrictModeEnabled(cfg)) {
    return models;
  }
  return models.filter((model) => isLocalProvider(model.provider));
}
