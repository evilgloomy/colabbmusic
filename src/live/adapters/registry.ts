import { setVoiceDiagnostics } from "./voice/voiceDiagnostics";
import { createBrowserSpeechAdapter } from "./speech/browserSpeech";
import { createMockSpeechAdapter } from "./speech/mockSpeech";
import { createMockAuroraAdapter } from "./aurora/mockAurora";
import { createServerAuroraAdapter } from "./aurora/serverAurora";
import { createMockLemoAdapter } from "./lemo/mockLemo";
import { createBrowserTtsPlaceholderAdapter } from "./voice/browserTtsVoice";
import { createMinimaxColaVoiceAdapter, MINIMAX_VOICE_LABEL } from "./voice/minimaxVoice";
import { AVATAR_PROVIDER_LABEL as AVATAR_LABEL } from "@/live/lib/avatar";
import type { AuroraAdapter, LemoAdapter, SpeechInputAdapter, VoiceAdapter } from "@/live/lib/types";

/**
 * Single place where providers are chosen. Full Aurora/ShibaOS and a realtime
 * avatar register here later — nothing else changes.
 */
export const LIVE_MOCK_MODE =
  (import.meta.env.VITE_LIVE_MOCK_MODE ?? "true").toString().toLowerCase() !== "false";

/**
 * Cola's real voice: MiniMax speech-2.8-turbo via the `cola-voice` edge
 * function. Set VITE_COLA_VOICE_ENABLED=false to force the emergency
 * browser-TTS fallback. The old VoiceStudio stub is deprecated and never
 * called on a turn.
 */
export const COLA_VOICE_ENABLED =
  (import.meta.env.VITE_COLA_VOICE_ENABLED ?? "true").toString().toLowerCase() !== "false";

export const AURORA_ENGINE_LABEL = "Aurora Lite";
export const AVATAR_PROVIDER_LABEL = AVATAR_LABEL;
export const VOICE_PROVIDER_LABEL = COLA_VOICE_ENABLED ? MINIMAX_VOICE_LABEL : "Browser TTS (emergency fallback)";
export const VOICESTUDIO_STATUS_NOTE = COLA_VOICE_ENABLED
  ? "Browser TTS: emergency fallback only · VoiceStudio: deprecated"
  : "MiniMax disabled by config · VoiceStudio: deprecated";

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
  const emergencyFallback = createBrowserTtsPlaceholderAdapter();
  if (COLA_VOICE_ENABLED) return createMinimaxColaVoiceAdapter(emergencyFallback);
  return { ...emergencyFallback,
    async speak(req, handlers) {
      setVoiceDiagnostics({ state: "fallback", browserTtsFallback: true, error: "minimax_disabled_by_config" });
      try { await emergencyFallback.speak(req, handlers); }
      finally { setVoiceDiagnostics({ browserTtsFallback: false }); }
    },
    cancel() { emergencyFallback.cancel(); setVoiceDiagnostics({ browserTtsFallback: false }); },
    flush() { emergencyFallback.flush(); setVoiceDiagnostics({ browserTtsFallback: false }); },
  };
}
