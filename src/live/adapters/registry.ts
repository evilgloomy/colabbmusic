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
 * Cola's real voice: MiniMax T2A via the `cola-voice` edge function.
 * Set VITE_COLA_VOICE_ENABLED=false to fall back to the browser placeholder.
 */
export const COLA_VOICE_ENABLED =
  (import.meta.env.VITE_COLA_VOICE_ENABLED ?? "true").toString().toLowerCase() !== "false";

/** Legacy VoiceStudio stub stays OFF until a real provider contract exists. */
export const VOICESTUDIO_ENABLED =
  (import.meta.env.VITE_VOICESTUDIO_ENABLED ?? "false").toString().toLowerCase() === "true";

export const AURORA_ENGINE_LABEL = "Aurora Lite";
export const AVATAR_PROVIDER_LABEL = AVATAR_LABEL;
export const VOICE_PROVIDER_LABEL = COLA_VOICE_ENABLED
  ? "Cola Voice (MiniMax)"
  : VOICESTUDIO_ENABLED
    ? "VoiceStudio (Cola voice)"
    : "Browser TTS Placeholder";
export const VOICESTUDIO_STATUS_NOTE = COLA_VOICE_ENABLED
  ? "MiniMax speech-02-hd · browser TTS fallback"
  : VOICESTUDIO_ENABLED
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
  if (COLA_VOICE_ENABLED) return createMinimaxVoiceAdapter(placeholder);
  return VOICESTUDIO_ENABLED ? createVoiceStudioAdapter(placeholder) : placeholder;
}
