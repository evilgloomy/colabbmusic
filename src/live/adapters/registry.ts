import { createBrowserSpeechAdapter } from "./speech/browserSpeech";
import { createMockSpeechAdapter } from "./speech/mockSpeech";
import { createMockAuroraAdapter } from "./aurora/mockAurora";
import { createServerAuroraAdapter } from "./aurora/serverAurora";
import { createMockLemoAdapter } from "./lemo/mockLemo";
import { createBrowserTtsPlaceholderAdapter } from "./voice/browserTtsVoice";
import { createVoiceStudioAdapter } from "./voice/voiceStudio";
import { AVATAR_PROVIDER_ID } from "@/live/lib/avatar";
import type { AuroraAdapter, LemoAdapter, SpeechInputAdapter, VoiceAdapter } from "@/live/lib/types";

/**
 * Single place where providers are chosen. Full Aurora/ShibaOS and a realtime
 * avatar register here later — nothing else changes.
 */
export const LIVE_MOCK_MODE =
  (import.meta.env.VITE_LIVE_MOCK_MODE ?? "true").toString().toLowerCase() !== "false";

export const AURORA_ENGINE_LABEL = "Aurora Lite";
export const AVATAR_PROVIDER_LABEL = `LiveColaAvatar (${AVATAR_PROVIDER_ID})`;

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
  // VoiceStudio first; browser TTS placeholder only as fallback.
  return createVoiceStudioAdapter(createBrowserTtsPlaceholderAdapter());
}
