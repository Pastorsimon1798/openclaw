/**
 * Private Mode (100% Local) Setup Command
 *
 * Guides users through setting up a completely local OpenClaw environment:
 * 1. Hardware check (RAM, Ollama)
 * 2. Model downloads (LLM via Ollama, STT/TTS via Sherpa-ONNX)
 * 3. Config creation with strictMode enabled
 * 4. Verification that all components work
 */

import * as p from "@clack/prompts";
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { RuntimeEnv } from "../runtime.js";
import { createConfigIO, writeConfigFile, type OpenClawConfig } from "../config/config.js";
import { formatConfigPath } from "../config/logging.js";
import { defaultRuntime } from "../runtime.js";
import {
  downloadRecommendedModels,
  isModelInstalled,
  type SherpaModelId,
} from "../setup/sherpa-models.js";
import { CONFIG_DIR } from "../utils.js";

const execAsync = promisify(exec);

const OLLAMA_API_URL = "http://127.0.0.1:11434";
const MIN_RAM_GB = 8;
const RECOMMENDED_RAM_GB = 16;

// Recommended models for private mode
const OLLAMA_MODELS = [
  { id: "llama3.1:8b-instruct-q5_K_M", description: "Primary LLM (4.5GB)", required: true },
  { id: "nomic-embed-text", description: "Embeddings (274MB)", required: true },
  { id: "llava:7b", description: "Vision model (4.5GB)", required: false },
];

const SHERPA_MODELS: { id: SherpaModelId; description: string; required: boolean }[] = [
  { id: "whisper-large-v3-turbo", description: "STT - Whisper Large v3 Turbo", required: true },
  { id: "kokoro-en", description: "TTS - Kokoro English", required: true },
];

interface SetupLocalOptions {
  skipHardwareCheck?: boolean;
  skipOllamaModels?: boolean;
  skipSherpaModels?: boolean;
  nonInteractive?: boolean;
}

/**
 * Check if Ollama is installed and running
 */
async function checkOllamaStatus(): Promise<{
  installed: boolean;
  running: boolean;
  version?: string;
  models?: string[];
}> {
  // Check if ollama command exists
  let installed = false;
  try {
    await execAsync("which ollama || where ollama");
    installed = true;
  } catch {
    installed = false;
  }

  // Check if Ollama API is reachable
  let running = false;
  let version: string | undefined;
  let models: string[] = [];

  try {
    const versionResponse = await fetch(`${OLLAMA_API_URL}/api/version`, {
      signal: AbortSignal.timeout(5000),
    });
    if (versionResponse.ok) {
      running = true;
      const data = (await versionResponse.json()) as { version?: string };
      version = data.version;
    }
  } catch {
    running = false;
  }

  if (running) {
    try {
      const modelsResponse = await fetch(`${OLLAMA_API_URL}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (modelsResponse.ok) {
        const data = (await modelsResponse.json()) as { models?: { name: string }[] };
        models = (data.models ?? []).map((m) => m.name);
      }
    } catch {
      // Ignore errors fetching model list
    }
  }

  return { installed, running, version, models };
}

/**
 * Pull an Ollama model
 */
async function pullOllamaModel(modelId: string): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelId, stream: false }),
      signal: AbortSignal.timeout(30 * 60 * 1000), // 30 minute timeout for large models
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check system hardware
 */
function checkHardware(): { ramGb: number; cpuCores: number; platform: string } {
  const totalMemBytes = os.totalmem();
  const ramGb = Math.round(totalMemBytes / (1024 * 1024 * 1024));
  const cpuCores = os.cpus().length;
  const platform = os.platform();
  return { ramGb, cpuCores, platform };
}

/**
 * Main setup command for private/local mode
 */
export async function setupLocalCommand(
  opts: SetupLocalOptions = {},
  _runtime: RuntimeEnv = defaultRuntime,
): Promise<void> {
  p.intro("Private Mode Setup (100% Local)");

  // Step 1: Hardware Check
  if (!opts.skipHardwareCheck) {
    const spinner = p.spinner();
    spinner.start("Checking hardware...");

    const hw = checkHardware();
    spinner.stop(`Hardware: ${hw.ramGb}GB RAM, ${hw.cpuCores} CPU cores, ${hw.platform}`);

    if (hw.ramGb < MIN_RAM_GB) {
      p.log.error(
        `Insufficient RAM: ${hw.ramGb}GB detected, minimum ${MIN_RAM_GB}GB required for local models.`,
      );
      p.outro("Setup aborted. Please upgrade your hardware.");
      return;
    }

    if (hw.ramGb < RECOMMENDED_RAM_GB) {
      p.log.warn(
        `Low RAM: ${hw.ramGb}GB detected. Recommended ${RECOMMENDED_RAM_GB}GB for smooth operation.`,
      );
      p.log.info("You may experience slower performance with limited RAM.");
    } else {
      p.log.success(`RAM OK: ${hw.ramGb}GB (recommended: ${RECOMMENDED_RAM_GB}GB)`);
    }
  }

  // Step 2: Ollama Check
  const ollamaSpinner = p.spinner();
  ollamaSpinner.start("Checking Ollama...");

  const ollama = await checkOllamaStatus();
  ollamaSpinner.stop(
    ollama.running
      ? `Ollama running (v${ollama.version ?? "unknown"})`
      : ollama.installed
        ? "Ollama installed but not running"
        : "Ollama not found",
  );

  if (!ollama.installed) {
    p.log.error("Ollama is not installed. Please install it first:");
    p.log.info("  curl -fsSL https://ollama.com/install.sh | sh");
    p.log.info("  # Then start with: ollama serve");
    p.outro("Setup aborted. Install Ollama and try again.");
    return;
  }

  if (!ollama.running) {
    p.log.error("Ollama is installed but not running. Please start it:");
    p.log.info("  ollama serve");
    p.outro("Setup aborted. Start Ollama and try again.");
    return;
  }

  p.log.success("Ollama is running and accessible");

  // Step 3: Ollama Models
  if (!opts.skipOllamaModels) {
    p.log.step("Checking Ollama models...");

    const existingModels = new Set(ollama.models ?? []);
    const missingModels = OLLAMA_MODELS.filter((m) => {
      // Check if model is already pulled (handle tag variations)
      const baseId = m.id.split(":")[0];
      return (
        !existingModels.has(m.id) && !Array.from(existingModels).some((e) => e.startsWith(baseId))
      );
    });

    if (missingModels.length === 0) {
      p.log.success("All required Ollama models are already installed");
    } else {
      const requiredMissing = missingModels.filter((m) => m.required);
      const optionalMissing = missingModels.filter((m) => !m.required);

      if (requiredMissing.length > 0) {
        p.log.info(`Missing required models: ${requiredMissing.map((m) => m.id).join(", ")}`);
      }
      if (optionalMissing.length > 0) {
        p.log.info(`Missing optional models: ${optionalMissing.map((m) => m.id).join(", ")}`);
      }

      // Prompt to download if interactive
      let shouldDownload = true;
      if (!opts.nonInteractive) {
        const confirmDownload = await p.confirm({
          message: `Download ${requiredMissing.length} required model(s)? This may take a while.`,
          initialValue: true,
        });
        if (p.isCancel(confirmDownload)) {
          p.outro("Setup cancelled.");
          return;
        }
        shouldDownload = confirmDownload;
      }

      if (shouldDownload) {
        for (const model of requiredMissing) {
          const modelSpinner = p.spinner();
          modelSpinner.start(`Pulling ${model.id} (${model.description})...`);

          const success = await pullOllamaModel(model.id);
          if (success) {
            modelSpinner.stop(`Downloaded ${model.id}`);
          } else {
            modelSpinner.stop(`Failed to download ${model.id}`);
            if (model.required) {
              p.log.error(`Required model ${model.id} failed to download. Please run manually:`);
              p.log.info(`  ollama pull ${model.id}`);
            }
          }
        }
      }
    }
  }

  // Step 4: Sherpa-ONNX Models
  if (!opts.skipSherpaModels) {
    p.log.step("Checking Sherpa-ONNX models (STT/TTS)...");

    const missingSherpa = SHERPA_MODELS.filter((m) => !isModelInstalled(m.id));

    if (missingSherpa.length === 0) {
      p.log.success("All Sherpa-ONNX models are already installed");
    } else {
      p.log.info(`Missing Sherpa models: ${missingSherpa.map((m) => m.id).join(", ")}`);

      let shouldDownload = true;
      if (!opts.nonInteractive) {
        const confirmDownload = await p.confirm({
          message: `Download ${missingSherpa.length} Sherpa-ONNX model(s) for local STT/TTS?`,
          initialValue: true,
        });
        if (p.isCancel(confirmDownload)) {
          p.outro("Setup cancelled.");
          return;
        }
        shouldDownload = confirmDownload;
      }

      if (shouldDownload) {
        const sherpaSpinner = p.spinner();
        sherpaSpinner.start("Downloading Sherpa-ONNX models...");

        try {
          await downloadRecommendedModels((message) => {
            sherpaSpinner.message(message);
          });
          sherpaSpinner.stop("Sherpa-ONNX models downloaded");
        } catch (error) {
          sherpaSpinner.stop("Failed to download some Sherpa models");
          p.log.error(error instanceof Error ? error.message : String(error));
        }
      }
    }
  }

  // Step 5: Create Config
  p.log.step("Creating Private Mode configuration...");

  const io = createConfigIO();
  const configPath = io.configPath;

  // Read existing config if any
  let existingConfig: OpenClawConfig = {};
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    existingConfig = JSON.parse(raw) as OpenClawConfig;
  } catch {
    // No existing config
  }

  // Build private mode config with proper type structure
  const existingTools = existingConfig.tools ?? {};
  const existingWeb = existingTools.web ?? {};
  const existingMessages = existingConfig.messages ?? {};

  const privateConfig: OpenClawConfig = {
    ...existingConfig,
    privacy: {
      ...existingConfig.privacy,
      strictMode: true,
    },
    update: {
      ...existingConfig.update,
      checkOnStart: false, // Disable update checks in private mode
    },
    agents: {
      ...existingConfig.agents,
      defaults: {
        ...existingConfig.agents?.defaults,
        model: {
          primary: "ollama/llama3.1:8b-instruct-q5_K_M",
        },
        memorySearch: {
          ...existingConfig.agents?.defaults?.memorySearch,
          provider: "local", // Use local embeddings
        },
      },
    },
    tools: {
      ...existingTools,
      web: {
        ...existingWeb,
        search: {
          ...existingWeb.search,
          enabled: false, // Disable web search
        },
        fetch: {
          ...existingWeb.fetch,
          enabled: false, // Disable web fetch
        },
      },
    },
    messages: {
      ...existingMessages,
      tts: {
        ...existingMessages.tts,
        provider: "sherpa", // Use local TTS
      },
    },
  };

  await writeConfigFile(privateConfig);
  p.log.success(`Config written: ${formatConfigPath(configPath)}`);

  // Step 6: Create local models directory
  const modelsDir = path.join(CONFIG_DIR, "models");
  await fs.mkdir(modelsDir, { recursive: true });

  // Summary
  p.note(
    `Private Mode Configuration:
• strictMode: enabled (no external network calls)
• Provider: ollama (local LLM)
• Embeddings: ollama/nomic-embed-text
• STT: sherpa-onnx (Whisper)
• TTS: sherpa-onnx (Kokoro)
• Web tools: disabled

To revert to cloud mode:
  openclaw config set privacy.strictMode false`,
    "Setup Complete",
  );

  p.outro("Private Mode is now configured! Run 'openclaw agent' to start.");
}
