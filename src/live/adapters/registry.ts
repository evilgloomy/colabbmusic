import { createBrowserSpeechAdapter } from "./speech/browserSpeech";
import { createMockSpeechAdapter } from "./speech/mockSpeech";
import { createMockAuroraAdapter } from "./aurora/mockAurora";
import { createServerAuroraAdapter } from "./aurora/serverAurora";
import { createMockLemoAdapter } from "./lemo/mockLemo";
import { createBrowserTtsPlaceholderAdapter } from "./voice/browserTtsVoice";
import { createVoiceStudioAdapter } from "./voice/voiceStudio";
import { createMinimaxVoiceAdapter } from "./voice/minimaxVoice";
import { AVATAR_PROVIDER_LABEL as AVATAR_LABEL } from "@/live/lib/avatar";
import type { AuroraAdapter, LemoAdapter, SpeechInputAdapter, VoiceAdapter } from "@/live/lib/types";

/**
 * Single place where providers are chosen. Full Aurora/ShibaOS and a realtime
 * avatar register here later — nothing else changes.
 */
export const LIVE_MOCK_MODE =
  (import.meta.env.VITE_LIVE_MOCK_MODE ?? "true").toString().toLowerCase() !== "false";

/**
 * VoiceStudio stays OFF until the provider's real API contract is supplied.
 * While it is off we never call the stub, so no failed request per utterance.
 */
export const VOICESTUDIO_ENABLED =
  (import.meta.env.VITE_VOICESTUDIO_ENABLED ?? "false").toString().toLowerCase() === "true";

export const AURORA_ENGINE_LABEL = "Aurora Lite";
export const AVATAR_PROVIDER_LABEL = AVATAR_LABEL;
export const VOICE_PROVIDER_LABEL = VOICESTUDIO_ENABLED
  ? "VoiceStudio (Cola voice)"
  : "Browser TTS Placeholder";
export const VOICESTUDIO_STATUS_NOTE = VOICESTUDIO_ENABLED
  ? "VoiceStudio: enabled"
  : "VoiceStudio: not configured";

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
  const placeholder = createBrowserTtsPlaceholderAdapter();
  // Ready but disabled: no VoiceStudio request is made while the flag is off.
  return VOICESTUDIO_ENABLED ? createVoiceStudioAdapter(placeholder) : placeholder;
}
