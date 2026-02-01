/**
 * Sherpa-ONNX model download and management.
 *
 * Downloads pre-trained models for local STT (Whisper) and TTS (Kokoro).
 * Models are stored in ~/.openclaw/models/sherpa-stt/ and ~/.openclaw/models/sherpa-tts/
 */

import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { CONFIG_DIR } from "../utils.js";

const SHERPA_STT_MODEL_DIR = path.join(CONFIG_DIR, "models", "sherpa-stt");
const SHERPA_TTS_MODEL_DIR = path.join(CONFIG_DIR, "models", "sherpa-tts");

// Model download URLs from k2-fsa/sherpa-onnx releases
const MODEL_SOURCES = {
  // Whisper models for STT
  "whisper-large-v3-turbo": {
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-large-v3-turbo.tar.bz2",
    type: "stt" as const,
    archiveType: "tar.bz2",
    description: "Whisper Large V3 Turbo - Fast and accurate (recommended)",
  },
  "whisper-tiny.en": {
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-tiny.en.tar.bz2",
    type: "stt" as const,
    archiveType: "tar.bz2",
    description: "Whisper Tiny English - Small and fast (English only)",
  },
  "sense-voice": {
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17.tar.bz2",
    type: "stt" as const,
    archiveType: "tar.bz2",
    description: "SenseVoice - Multi-language (Chinese, English, Japanese, Korean, Cantonese)",
  },
  // Kokoro models for TTS
  "kokoro-en": {
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-en-v0_19.tar.bz2",
    type: "tts" as const,
    archiveType: "tar.bz2",
    description: "Kokoro English - High quality English TTS (#1 on HF Arena)",
  },
  "kokoro-multi": {
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2",
    type: "tts" as const,
    archiveType: "tar.bz2",
    description: "Kokoro Multi-language - Chinese and English TTS",
  },
  // Silero VAD (optional, for voice activity detection)
  "silero-vad": {
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx",
    type: "vad" as const,
    archiveType: "none",
    description: "Silero VAD - Voice activity detection",
  },
} as const;

export type SherpaModelId = keyof typeof MODEL_SOURCES;

export type SherpaModelInfo = {
  id: SherpaModelId;
  type: "stt" | "tts" | "vad";
  description: string;
  installed: boolean;
  path: string;
};

/**
 * Get the installation directory for a model.
 */
export function getModelDir(modelId: SherpaModelId): string {
  const model = MODEL_SOURCES[modelId];
  const modelType = model.type;
  if (modelType === "stt") {
    return path.join(SHERPA_STT_MODEL_DIR, modelId);
  }
  if (modelType === "tts") {
    return path.join(SHERPA_TTS_MODEL_DIR, modelId);
  }
  if (modelType === "vad") {
    return path.join(SHERPA_STT_MODEL_DIR, "vad");
  }
  // Should never reach here
  return path.join(SHERPA_STT_MODEL_DIR, modelId);
}

/**
 * Check if a model is installed.
 */
export function isModelInstalled(modelId: SherpaModelId): boolean {
  const modelDir = getModelDir(modelId);
  return existsSync(modelDir);
}

/**
 * List all available models with their installation status.
 */
export function listAvailableModels(): SherpaModelInfo[] {
  return Object.entries(MODEL_SOURCES).map(([id, info]) => ({
    id: id as SherpaModelId,
    type: info.type,
    description: info.description,
    installed: isModelInstalled(id as SherpaModelId),
    path: getModelDir(id as SherpaModelId),
  }));
}

/**
 * Download and extract a model.
 *
 * @param modelId - The model ID to download
 * @param progress - Optional callback for progress updates
 * @returns The path to the installed model
 */
export async function downloadModel(
  modelId: SherpaModelId,
  progress?: (message: string) => void,
): Promise<string> {
  const model = MODEL_SOURCES[modelId];
  const modelDir = getModelDir(modelId);
  const parentDir = path.dirname(modelDir);

  // Ensure parent directory exists
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  // If already installed, skip
  if (existsSync(modelDir)) {
    progress?.(`Model ${modelId} is already installed at ${modelDir}`);
    return modelDir;
  }

  progress?.(`Downloading ${modelId}...`);

  const response = await fetch(model.url, {
    headers: {
      "User-Agent": "OpenClaw/1.0",
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download model: HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  let downloaded = 0;

  if (model.archiveType === "none") {
    // Single file download (e.g., silero_vad.onnx)
    mkdirSync(modelDir, { recursive: true });
    const filePath = path.join(modelDir, path.basename(model.url));
    const fileStream = createWriteStream(filePath);

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      downloaded += value.length;
      fileStream.write(Buffer.from(value));
      if (contentLength > 0) {
        const percent = Math.round((downloaded / contentLength) * 100);
        progress?.(`Downloading ${modelId}: ${percent}%`);
      }
    }
    fileStream.end();

    progress?.(`Model ${modelId} installed at ${modelDir}`);
    return modelDir;
  }

  // Archive download (tar.bz2)
  const tempArchive = path.join(parentDir, `${modelId}.tar.bz2`);
  const fileStream = createWriteStream(tempArchive);

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    downloaded += value.length;
    fileStream.write(Buffer.from(value));
    if (contentLength > 0) {
      const percent = Math.round((downloaded / contentLength) * 100);
      progress?.(`Downloading ${modelId}: ${percent}%`);
    }
  }
  fileStream.end();

  progress?.(`Extracting ${modelId}...`);

  // Extract using tar
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execPromise = promisify(exec);

  try {
    await execPromise(`tar xjf "${tempArchive}" -C "${parentDir}"`, {
      timeout: 300_000, // 5 minute timeout for extraction
    });
  } catch (error) {
    // Cleanup on failure
    try {
      rmSync(tempArchive, { force: true });
    } catch {}
    throw new Error(`Failed to extract model: ${String(error)}`, { cause: error });
  }

  // Cleanup archive
  try {
    rmSync(tempArchive, { force: true });
  } catch {}

  // Find the extracted directory (it may have a different name)
  const extractedDirs = (await import("node:fs/promises"))
    .readdir(parentDir)
    .then((files) => files.filter((f) => f.startsWith("sherpa-onnx-") || f.startsWith("kokoro-")));

  const dirs = await extractedDirs;
  const extractedDir = dirs.find((d) => d.includes(modelId.replace(/-/g, ""))) || dirs[0];

  if (extractedDir && extractedDir !== modelId) {
    // Rename to standard name
    const extractedPath = path.join(parentDir, extractedDir);
    const fs = await import("node:fs/promises");
    await fs.rename(extractedPath, modelDir);
  }

  progress?.(`Model ${modelId} installed at ${modelDir}`);
  return modelDir;
}

/**
 * Download recommended models for Private Mode.
 *
 * Downloads:
 * - whisper-large-v3-turbo (STT)
 * - kokoro-en (TTS)
 */
export async function downloadRecommendedModels(
  progress?: (message: string) => void,
): Promise<void> {
  const recommended: SherpaModelId[] = ["whisper-large-v3-turbo", "kokoro-en"];

  for (const modelId of recommended) {
    await downloadModel(modelId, progress);
  }
}

/**
 * Get the default STT model path if available.
 */
export function getDefaultSTTModelPath(): string | null {
  const preferred: SherpaModelId[] = ["whisper-large-v3-turbo", "whisper-tiny.en", "sense-voice"];
  for (const modelId of preferred) {
    if (isModelInstalled(modelId)) {
      return getModelDir(modelId);
    }
  }
  return null;
}

/**
 * Get the default TTS model path if available.
 */
export function getDefaultTTSModelPath(): string | null {
  const preferred: SherpaModelId[] = ["kokoro-en", "kokoro-multi"];
  for (const modelId of preferred) {
    if (isModelInstalled(modelId)) {
      return getModelDir(modelId);
    }
  }
  return null;
}
