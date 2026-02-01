/**
 * Sherpa-ONNX local TTS provider (Kokoro model).
 *
 * Uses sherpa-onnx-node for offline (local) text-to-speech synthesis.
 * Supports Kokoro, Piper VITS, and other ONNX TTS models.
 *
 * Model files must be downloaded separately to ~/.openclaw/models/sherpa-tts/
 */

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { CONFIG_DIR } from "../utils.js";

// Default model paths
const DEFAULT_SHERPA_TTS_MODEL_DIR = path.join(CONFIG_DIR, "models", "sherpa-tts");
const DEFAULT_KOKORO_MODEL = "kokoro-en-v0_19";

export type SherpaTTSConfig = {
  modelDir?: string;
  modelName?: string;
  numThreads?: number;
  speakerId?: number;
  speed?: number;
};

export type SherpaTTSResult = {
  samples: Float32Array;
  sampleRate: number;
};

type SherpaOnnxModule = {
  OfflineTts: new (config: unknown) => SherpaOfflineTts;
  writeWave: (filename: string, audio: { samples: Float32Array; sampleRate: number }) => void;
  version?: string;
};

type SherpaOfflineTts = {
  generate: (params: { text: string; sid: number; speed: number }) => {
    samples: Float32Array;
    sampleRate: number;
  };
  numSpeakers: () => number;
  sampleRate: () => number;
};

// Lazy-loaded sherpa-onnx module
let sherpaModule: SherpaOnnxModule | null = null;
let sherpaLoadError: Error | null = null;

async function loadSherpaModule(): Promise<SherpaOnnxModule> {
  if (sherpaModule) {
    return sherpaModule;
  }
  if (sherpaLoadError) {
    throw sherpaLoadError;
  }

  try {
    const module = await import("sherpa-onnx-node");
    const loaded = (module.default || module) as SherpaOnnxModule;
    sherpaModule = loaded;
    return loaded;
  } catch (error) {
    sherpaLoadError = new Error(
      `Failed to load sherpa-onnx-node: ${String(error)}. ` +
        "Ensure the package is installed and native binaries are available.",
      { cause: error },
    );
    throw sherpaLoadError;
  }
}

// Cached TTS instance
let ttsCache: { config: string; tts: SherpaOfflineTts } | null = null;

function buildKokoroConfig(modelDir: string, numThreads: number): unknown {
  const modelPath = path.join(modelDir, "model.onnx");
  const voicesPath = path.join(modelDir, "voices.bin");
  const tokensPath = path.join(modelDir, "tokens.txt");
  const dataDirPath = path.join(modelDir, "espeak-ng-data");

  return {
    model: {
      kokoro: {
        model: modelPath,
        voices: voicesPath,
        tokens: tokensPath,
        dataDir: dataDirPath,
      },
      debug: false,
      numThreads,
      provider: "cpu",
    },
    maxNumSentences: 2,
  };
}

async function getOrCreateTts(
  sherpa: SherpaOnnxModule,
  config: SherpaTTSConfig,
): Promise<SherpaOfflineTts> {
  const modelDir =
    config.modelDir ||
    path.join(DEFAULT_SHERPA_TTS_MODEL_DIR, config.modelName || DEFAULT_KOKORO_MODEL);
  const numThreads = config.numThreads || 1;
  const cacheKey = JSON.stringify({ modelDir, numThreads });

  if (ttsCache && ttsCache.config === cacheKey) {
    return ttsCache.tts;
  }

  // Verify model directory exists
  if (!existsSync(modelDir)) {
    throw new Error(
      `Sherpa TTS model not found at ${modelDir}. ` +
        "Download models with: openclaw setup local --download-models",
    );
  }

  const ttsConfig = buildKokoroConfig(modelDir, numThreads);
  const tts = new sherpa.OfflineTts(ttsConfig);

  ttsCache = { config: cacheKey, tts };
  return tts;
}

/**
 * Generate speech from text using Sherpa-ONNX (local, offline).
 *
 * @param text - The text to synthesize
 * @param config - Optional TTS configuration
 * @returns Audio samples and sample rate
 */
export async function generateSherpaSpeech(
  text: string,
  config?: SherpaTTSConfig,
): Promise<SherpaTTSResult> {
  const sherpa = await loadSherpaModule();
  const tts = await getOrCreateTts(sherpa, config || {});

  const speakerId = config?.speakerId ?? 0;
  const speed = config?.speed ?? 1.0;

  const audio = tts.generate({ text, sid: speakerId, speed });

  return {
    samples: audio.samples,
    sampleRate: audio.sampleRate,
  };
}

/**
 * Generate speech and save to a WAV file.
 *
 * @param text - The text to synthesize
 * @param outputPath - Path to save the WAV file
 * @param config - Optional TTS configuration
 * @returns The output file path
 */
export async function generateSherpaSpeechToFile(
  text: string,
  outputPath: string,
  config?: SherpaTTSConfig,
): Promise<string> {
  const sherpa = await loadSherpaModule();
  const audio = await generateSherpaSpeech(text, config);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  sherpa.writeWave(outputPath, { samples: audio.samples, sampleRate: audio.sampleRate });
  return outputPath;
}

/**
 * Convert Sherpa TTS output to a Buffer (WAV format).
 *
 * @param samples - Float32Array of audio samples
 * @param sampleRate - Sample rate (e.g., 24000)
 * @returns WAV file as Buffer
 */
export function sherpaSamplesToWavBuffer(samples: Float32Array, sampleRate: number): Buffer {
  // Create WAV header and data
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const fileSize = headerSize + dataSize - 8;

  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Convert float samples to 16-bit PCM
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, headerSize + i * 2);
  }

  return buffer;
}

/**
 * Check if Sherpa-ONNX TTS is available and configured.
 */
export async function isSherpaTTSAvailable(config?: SherpaTTSConfig): Promise<boolean> {
  try {
    await loadSherpaModule();
    const modelDir =
      config?.modelDir ||
      path.join(DEFAULT_SHERPA_TTS_MODEL_DIR, config?.modelName || DEFAULT_KOKORO_MODEL);
    return existsSync(modelDir);
  } catch {
    return false;
  }
}

/**
 * Get the path where Sherpa TTS models should be installed.
 */
export function getSherpaTTSModelDir(): string {
  return DEFAULT_SHERPA_TTS_MODEL_DIR;
}

/**
 * Get available speaker IDs for the current model.
 */
export async function getSherpaTTSSpeakers(config?: SherpaTTSConfig): Promise<number> {
  const sherpa = await loadSherpaModule();
  const tts = await getOrCreateTts(sherpa, config || {});
  return tts.numSpeakers();
}
