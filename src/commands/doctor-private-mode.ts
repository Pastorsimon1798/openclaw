/**
 * Doctor checks for Private Mode (strictMode) configuration.
 *
 * Verifies:
 * - If strictMode is enabled, Ollama is reachable
 * - If strictMode is enabled, at least one Ollama model is available
 * - If strictMode is enabled, cloud provider API keys are not configured (warning only)
 */

import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import { isStrictModeEnabled } from "../infra/strict-mode.js";
import { note } from "../terminal/note.js";
import { theme } from "../terminal/theme.js";

const OLLAMA_API_URL = "http://127.0.0.1:11434";

type OllamaStatus = {
  reachable: boolean;
  version?: string;
  models: string[];
};

async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const versionResponse = await fetch(`${OLLAMA_API_URL}/api/version`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!versionResponse.ok) {
      return { reachable: false, models: [] };
    }
    const versionData = (await versionResponse.json()) as { version?: string };

    const modelsResponse = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    let models: string[] = [];
    if (modelsResponse.ok) {
      const modelsData = (await modelsResponse.json()) as { models?: { name: string }[] };
      models = (modelsData.models ?? []).map((m) => m.name);
    }

    return {
      reachable: true,
      version: versionData.version,
      models,
    };
  } catch {
    return { reachable: false, models: [] };
  }
}

export async function notePrivateModeStatus(params: {
  cfg: OpenClawConfig;
  runtime: RuntimeEnv;
}): Promise<void> {
  const { cfg, runtime } = params;

  if (!isStrictModeEnabled(cfg)) {
    return; // Private Mode not enabled, nothing to check
  }

  runtime.log?.(theme.heading("Private Mode (strictMode)"));

  const ollama = await checkOllamaStatus();

  if (!ollama.reachable) {
    note(
      `${theme.error("Ollama is not reachable")}

Private Mode requires Ollama for local LLM inference.

${theme.muted("To fix:")}
  1. Install Ollama: ${theme.command("curl -fsSL https://ollama.com/install.sh | sh")}
  2. Start Ollama: ${theme.command("ollama serve")}
  3. Pull a model: ${theme.command("ollama pull llama3.1:8b")}`,
      "Private Mode Issue",
    );
    return;
  }

  runtime.log?.(`  ${theme.success("✓")} Ollama running (v${ollama.version ?? "unknown"})`);

  if (ollama.models.length === 0) {
    note(
      `${theme.warn("No Ollama models found")}

Private Mode requires at least one Ollama model.

${theme.muted("To fix:")}
  ${theme.command("ollama pull llama3.1:8b")}`,
      "Private Mode Issue",
    );
    return;
  }

  runtime.log?.(`  ${theme.success("✓")} ${ollama.models.length} model(s) available`);
  runtime.log?.(
    `    ${theme.muted(ollama.models.slice(0, 5).join(", "))}${ollama.models.length > 5 ? "..." : ""}`,
  );

  // Check for cloud API keys that won't be used in Private Mode
  const hasCloudKeys = !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_API_KEY
  );

  if (hasCloudKeys) {
    runtime.log?.(`  ${theme.warn("⚠")} Cloud API keys detected (ignored in Private Mode)`);
  }

  runtime.log?.(`  ${theme.success("✓")} Private Mode is properly configured`);
}
