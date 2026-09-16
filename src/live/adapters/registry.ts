import { createBrowserSpeechAdapter } from "./speech/browserSpeech";
import { createMockSpeechAdapter } from "./speech/mockSpeech";
import { createMockAuroraAdapter } from "./aurora/mockAurora";
import { createServerAuroraAdapter } from "./aurora/serverAurora";
import { createMockLemoAdapter } from "./lemo/mockLemo";
import { createMockVoiceAdapter } from "./voice/mockVoice";
import type { AuroraAdapter, LemoAdapter, SpeechInputAdapter, VoiceAdapter } from "@/live/lib/types";

/**
 * Single place where providers are chosen. Phase 2 registers real Aurora, LEMO
 * and Cola Voice implementations here — nothing else changes.
 */
export const LIVE_MOCK_MODE =
  (import.meta.env.VITE_LIVE_MOCK_MODE ?? "true").toString().toLowerCase() !== "false";

export type SpeechMode = "browser" | "simulated";

export function getSpeechAdapter(mode: SpeechMode): SpeechInputAdapter {
  return mode === "simulated" ? createMockSpeechAdapter() : createBrowserSpeechAdapter();
}

export function getAuroraAdapter(opts?: { local?: boolean }): AuroraAdapter {
  return opts?.local ? createMockAuroraAdapter() : createServerAuroraAdapter();
}

export function getLemoAdapter(): LemoAdapter {
  // Server turns already return LEMO; this local adapter is the fallback path.
  return createMockLemoAdapter();
}

export function getVoiceAdapter(): VoiceAdapter {
  // Phase 2: return a streaming Cola Voice adapter here.
  return createMockVoiceAdapter();
}
