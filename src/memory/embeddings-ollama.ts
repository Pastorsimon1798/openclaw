/**
 * Ollama embeddings provider for local embedding generation.
 * Uses Ollama's OpenAI-compatible /api/embeddings endpoint.
 */

import type { EmbeddingProvider, EmbeddingProviderOptions } from "./embeddings.js";

export type OllamaEmbeddingClient = {
  baseUrl: string;
  model: string;
};

type OllamaEmbeddingResponse = {
  embedding: number[];
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_EMBEDDING_MODEL = "mxbai-embed-large";

/**
 * Create an Ollama embedding provider.
 * Uses the Ollama /api/embeddings endpoint for local embedding generation.
 */
export async function createOllamaEmbeddingProvider(
  options: EmbeddingProviderOptions,
): Promise<{ provider: EmbeddingProvider; client: OllamaEmbeddingClient }> {
  const baseUrl = options.remote?.baseUrl?.trim() || DEFAULT_OLLAMA_BASE_URL;
  const model = options.model?.trim() || DEFAULT_OLLAMA_EMBEDDING_MODEL;

  const client: OllamaEmbeddingClient = { baseUrl, model };

  // Verify Ollama is reachable before returning the provider
  await verifyOllamaConnection(baseUrl);

  const embedQuery = async (text: string): Promise<number[]> => {
    const url = `${baseUrl.replace(/\/$/, "")}/api/embeddings`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Ollama embeddings failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OllamaEmbeddingResponse;
    if (!Array.isArray(data.embedding)) {
      throw new Error("Ollama returned invalid embedding format");
    }
    return data.embedding;
  };

  // Ollama doesn't support batch embeddings natively, so we process sequentially
  const embedBatch = async (texts: string[]): Promise<number[][]> => {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await embedQuery(text);
      embeddings.push(embedding);
    }
    return embeddings;
  };

  const provider: EmbeddingProvider = {
    id: "ollama",
    model,
    embedQuery,
    embedBatch,
  };

  return { provider, client };
}

/**
 * Verify Ollama is reachable at the given base URL.
 */
async function verifyOllamaConnection(baseUrl: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Cannot connect to Ollama at ${baseUrl} (timeout). Ensure Ollama is running: ollama serve`,
        { cause: error },
      );
    }
    throw new Error(
      `Cannot connect to Ollama at ${baseUrl}. Ensure Ollama is running: ollama serve`,
      { cause: error },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Resolve Ollama embedding client configuration from options.
 */
export function resolveOllamaEmbeddingClient(
  options: EmbeddingProviderOptions,
): OllamaEmbeddingClient {
  return {
    baseUrl: options.remote?.baseUrl?.trim() || DEFAULT_OLLAMA_BASE_URL,
    model: options.model?.trim() || DEFAULT_OLLAMA_EMBEDDING_MODEL,
  };
}
