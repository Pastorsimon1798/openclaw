/**
 * Sherpa-ONNX media understanding provider.
 *
 * Provides local, offline audio transcription using sherpa-onnx-node.
 * This is used in Private Mode to ensure no network calls for STT.
 */

import type {
  MediaUnderstandingProvider,
  AudioTranscriptionRequest,
  AudioTranscriptionResult,
} from "../../types.js";
import { transcribeSherpaAudio, isSherpaSTTAvailable, type SherpaSTTConfig } from "./audio.js";

// Default Sherpa STT configuration
const defaultConfig: SherpaSTTConfig = {
  numThreads: 2,
};

export const sherpaProvider: MediaUnderstandingProvider = {
  id: "sherpa",
  capabilities: ["audio"],

  transcribeAudio: async (req: AudioTranscriptionRequest): Promise<AudioTranscriptionResult> => {
    // Extract language hint from request if provided
    const config: SherpaSTTConfig = {
      ...defaultConfig,
      language: req.language,
    };
    return transcribeSherpaAudio(req, config);
  },
};

export { transcribeSherpaAudio, isSherpaSTTAvailable, getSherpaSTTModelDir } from "./audio.js";
export type { SherpaSTTConfig } from "./audio.js";
