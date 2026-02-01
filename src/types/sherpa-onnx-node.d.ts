/**
 * Type declarations for sherpa-onnx-node package.
 *
 * These are minimal types to enable TypeScript compilation.
 * The actual API may have more options than documented here.
 */

declare module "sherpa-onnx-node" {
  export interface SherpaAudioSamples {
    sampleRate: number;
    samples: Float32Array;
  }

  export interface SherpaRecognizerConfig {
    featConfig?: {
      sampleRate?: number;
      featureDim?: number;
    };
    modelConfig?: {
      whisper?: {
        encoder?: string;
        decoder?: string;
        language?: string;
        task?: string;
      };
      paraformer?: {
        model?: string;
      };
      senseVoice?: {
        model?: string;
        language?: string;
      };
      tokens?: string;
      numThreads?: number;
      provider?: string;
      debug?: number;
    };
  }

  export interface SherpaResult {
    text: string;
    timestamps?: number[];
    tokens?: string[];
    lang?: string;
  }

  export interface SherpaStream {
    acceptWaveform(params: SherpaAudioSamples): void;
  }

  export class OfflineRecognizer {
    constructor(config: SherpaRecognizerConfig);
    createStream(): SherpaStream;
    decode(stream: SherpaStream): void;
    getResult(stream: SherpaStream): SherpaResult;
  }

  export interface SherpaTtsConfig {
    model?: {
      kokoro?: {
        model?: string;
        voices?: string;
        tokens?: string;
        dataDir?: string;
      };
      vits?: {
        model?: string;
        tokens?: string;
        lexicon?: string;
        dataDir?: string;
      };
      debug?: boolean;
      numThreads?: number;
      provider?: string;
    };
    maxNumSentences?: number;
  }

  export interface SherpaTtsGenerateParams {
    text: string;
    sid: number;
    speed: number;
  }

  export class OfflineTts {
    constructor(config: SherpaTtsConfig);
    generate(params: SherpaTtsGenerateParams): SherpaAudioSamples;
    numSpeakers(): number;
    sampleRate(): number;
  }

  export function readWave(filename: string): SherpaAudioSamples;
  export function writeWave(filename: string, audio: SherpaAudioSamples): void;

  export const version: string;
  export const gitSha1: string;
  export const gitDate: string;
}
