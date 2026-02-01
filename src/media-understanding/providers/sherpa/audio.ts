/**
 * Sherpa-ONNX local audio transcription provider.
 *
 * Uses sherpa-onnx-node for offline (local) speech-to-text transcription.
 * Supports Whisper, Paraformer, SenseVoice, and other ONNX STT models.
 *
 * Model files must be downloaded separately to ~/.openclaw/models/sherpa-stt/
 */

import { existsSync } from "node:fs";
import path from "node:path";
import type { AudioTranscriptionRequest, AudioTranscriptionResult } from "../../types.js";
import { CONFIG_DIR } from "../../../utils.js";

// Default model paths relative to CONFIG_DIR/models/sherpa-stt/
const DEFAULT_SHERPA_STT_MODEL_DIR = path.join(CONFIG_DIR, "models", "sherpa-stt");
const DEFAULT_WHISPER_MODEL = "sherpa-onnx-whisper-large-v3-turbo";

export type SherpaSTTConfig = {
  modelDir?: string;
  modelName?: string;
  numThreads?: number;
  language?: string;
};

type SherpaOnnxModule = {
  OfflineRecognizer: new (config: unknown) => SherpaOfflineRecognizer;
  readWave: (filename: string) => { sampleRate: number; samples: Float32Array };
  version?: string;
};

type SherpaOfflineRecognizer = {
  createStream: () => SherpaStream;
  decode: (stream: SherpaStream) => void;
  getResult: (stream: SherpaStream) => SherpaResult;
};

type SherpaStream = {
  acceptWaveform: (params: { sampleRate: number; samples: Float32Array }) => void;
};

type SherpaResult = {
  text: string;
  timestamps?: number[];
  tokens?: string[];
  lang?: string;
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
    // Dynamic import to avoid loading native module if not used
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

// Cached recognizer instance
let recognizerCache: { config: string; recognizer: SherpaOfflineRecognizer } | null = null;

function buildWhisperConfig(modelDir: string, numThreads: number, language?: string): unknown {
  const encoderPath = path.join(modelDir, "encoder.int8.onnx");
  const decoderPath = path.join(modelDir, "decoder.int8.onnx");
  const tokensPath = path.join(modelDir, "tokens.txt");

  // Check for alternative naming conventions
  const altEncoderPath = path.join(modelDir, "model.int8.onnx");

  const actualEncoder = existsSync(encoderPath)
    ? encoderPath
    : existsSync(altEncoderPath)
      ? altEncoderPath
      : encoderPath;

  return {
    featConfig: {
      sampleRate: 16000,
      featureDim: 80,
    },
    modelConfig: {
      whisper: {
        encoder: actualEncoder,
        decoder: decoderPath,
        language: language || "",
        task: "transcribe",
      },
      tokens: tokensPath,
      numThreads,
      provider: "cpu",
      debug: 0,
    },
  };
}

async function getOrCreateRecognizer(
  sherpa: SherpaOnnxModule,
  config: SherpaSTTConfig,
): Promise<SherpaOfflineRecognizer> {
  const modelDir =
    config.modelDir ||
    path.join(DEFAULT_SHERPA_STT_MODEL_DIR, config.modelName || DEFAULT_WHISPER_MODEL);
  const numThreads = config.numThreads || 2;
  const cacheKey = JSON.stringify({ modelDir, numThreads, language: config.language });

  if (recognizerCache && recognizerCache.config === cacheKey) {
    return recognizerCache.recognizer;
  }

  // Verify model directory exists
  if (!existsSync(modelDir)) {
    throw new Error(
      `Sherpa STT model not found at ${modelDir}. ` +
        "Download models with: openclaw setup local --download-models",
    );
  }

  const recognizerConfig = buildWhisperConfig(modelDir, numThreads, config.language);
  const recognizer = new sherpa.OfflineRecognizer(recognizerConfig);

  recognizerCache = { config: cacheKey, recognizer };
  return recognizer;
}

/**
 * Convert audio buffer to Float32Array samples.
 * Assumes 16-bit PCM audio at 16kHz mono.
 */
function audioBufferToSamples(buffer: Buffer, _sampleRate: number): Float32Array {
  // If the buffer is raw PCM 16-bit
  const samples = new Float32Array(buffer.length / 2);
  for (let i = 0; i < samples.length; i++) {
    // Read 16-bit little-endian signed integer
    const sample = buffer.readInt16LE(i * 2);
    // Normalize to [-1, 1]
    samples[i] = sample / 32768;
  }
  return samples;
}

/**
 * Transcribe audio using Sherpa-ONNX (local, offline).
 *
 * Note: This ignores the apiKey parameter as it's a local provider.
 * The buffer should contain audio data (WAV or raw PCM).
 */
export async function transcribeSherpaAudio(
  params: AudioTranscriptionRequest,
  config?: SherpaSTTConfig,
): Promise<AudioTranscriptionResult> {
  const sherpa = await loadSherpaModule();
  const recognizer = await getOrCreateRecognizer(sherpa, config || {});

  // Create a stream and process the audio
  const stream = recognizer.createStream();

  // Determine sample rate from params or default to 16kHz
  const sampleRate = 16000; // Sherpa models typically expect 16kHz

  // Convert buffer to samples
  // For WAV files, we'd need to parse the header - for now assume raw PCM
  const samples = audioBufferToSamples(params.buffer, sampleRate);

  stream.acceptWaveform({ sampleRate, samples });
  recognizer.decode(stream);
  const result = recognizer.getResult(stream);

  if (!result.text?.trim()) {
    return { text: "", model: config?.modelName || DEFAULT_WHISPER_MODEL };
  }

  return {
    text: result.text.trim(),
    model: config?.modelName || DEFAULT_WHISPER_MODEL,
  };
}

/**
 * Check if Sherpa-ONNX STT is available and configured.
 */
export async function isSherpaSTTAvailable(config?: SherpaSTTConfig): Promise<boolean> {
  try {
    await loadSherpaModule();
    const modelDir =
      config?.modelDir ||
      path.join(DEFAULT_SHERPA_STT_MODEL_DIR, config?.modelName || DEFAULT_WHISPER_MODEL);
    return existsSync(modelDir);
  } catch {
    return false;
  }
}

/**
 * Get the path where Sherpa STT models should be installed.
 */
export function getSherpaSTTModelDir(): string {
  return DEFAULT_SHERPA_STT_MODEL_DIR;
}
