/**
 * Private Mode error handling.
 * Provides clear, user-friendly error messages when features are blocked in strict mode.
 */

export type PrivateModeErrorContext = "tool" | "model" | "provider" | "network" | "ollama";

/**
 * Error thrown when an operation is blocked in Private Mode.
 */
export class PrivateModeError extends Error {
  public readonly context: PrivateModeErrorContext;

  constructor(context: PrivateModeErrorContext, message: string) {
    super(`[Private Mode] ${message}`);
    this.name = "PrivateModeError";
    this.context = context;
  }
}

/**
 * Pre-flight check: Verify Ollama is reachable before enabling strict mode.
 * @param baseUrl - Ollama API base URL (default: http://127.0.0.1:11434)
 * @param timeoutMs - Request timeout in milliseconds (default: 5000)
 * @throws PrivateModeError if Ollama is not reachable
 */
export async function requireOllamaAvailable(
  baseUrl = "http://127.0.0.1:11434",
  timeoutMs = 5000,
): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new PrivateModeError(
        "ollama",
        `Ollama returned status ${response.status}. Ensure Ollama is running with: ollama serve`,
      );
    }
  } catch (error) {
    if (error instanceof PrivateModeError) {
      throw error;
    }
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Ollama connection timed out after ${timeoutMs}ms`
        : `Cannot connect to Ollama at ${baseUrl}`;

    throw new PrivateModeError(
      "ollama",
      `${message}. Private Mode requires Ollama. Start Ollama with: ollama serve`,
    );
  }
}

/**
 * Create an error for when a tool is disabled in private mode.
 */
export function toolDisabledInPrivateMode(toolName: string): PrivateModeError {
  return new PrivateModeError("tool", `Tool "${toolName}" is disabled in private mode.`);
}

/**
 * Create an error for when a cloud model is requested in private mode.
 */
export function cloudModelDisabledInPrivateMode(modelRef: string): PrivateModeError {
  return new PrivateModeError(
    "model",
    `Model "${modelRef}" is not available in private mode. Use a local Ollama model instead.`,
  );
}

/**
 * Create an error for when a cloud provider is requested in private mode.
 */
export function cloudProviderDisabledInPrivateMode(provider: string): PrivateModeError {
  return new PrivateModeError(
    "provider",
    `Provider "${provider}" is not available in private mode. Only local providers (ollama, local) are allowed.`,
  );
}

/**
 * Create an error for when an external network call is blocked in private mode.
 */
export function networkCallBlockedInPrivateMode(url: string): PrivateModeError {
  return new PrivateModeError(
    "network",
    `External network call to "${url}" is blocked in private mode.`,
  );
}

/**
 * Check if an error is a PrivateModeError.
 */
export function isPrivateModeError(error: unknown): error is PrivateModeError {
  return error instanceof PrivateModeError;
}
