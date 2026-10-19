import { supabase } from "@/integrations/supabase/client";
import { realtimeAvatarBridge } from "@/live/avatar/realtimeAvatar";
import { setVoiceDiagnostics } from "./voiceDiagnostics";
import type { VoiceAdapter, VoiceHandlers, VoiceRequest } from "@/live/lib/types";

export const MINIMAX_VOICE_LABEL = "MiniMax Speech 2.8 Turbo — Cola B";

/** MiniMax owns the voice. Only one of WebRTC or local WebAudio plays a reply. */
export function createMinimaxColaVoiceAdapter(fallback: VoiceAdapter): VoiceAdapter {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let current: AudioBufferSourceNode | null = null;
  let controller: AbortController | null = null;
  let finishLocal: (() => void) | null = null;
  let speaking = false, usingFallback = false, usingAvatar = false, generation = 0;
  let lastTtfa: number | null = null;
  const levels = new Uint8Array(128);
  const ensureCtx = async () => {
    if (!ctx) {
      ctx = new AudioContext(); analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.connect(ctx.destination);
    }
    if (ctx.state === "suspended") await ctx.resume();
    return ctx;
  };
  const stopLocal = () => {
    try { current?.stop(); } catch { /* already stopped */ }
    current?.disconnect(); current = null; finishLocal?.(); finishLocal = null;
  };
  const cancel = () => {
    generation++; controller?.abort(); controller = null; speaking = false; usingAvatar = false;
    stopLocal(); realtimeAvatarBridge.interrupt(); fallback.cancel();
    setVoiceDiagnostics({ browserTtsFallback: false });
  };
  const localPlay = async (audio: AudioBuffer, gen: number, handlers: VoiceHandlers) => {
    if (gen !== generation || !ctx || !analyser) return;
    usingAvatar = false;
    const node = ctx.createBufferSource(); node.buffer = audio; node.connect(analyser); current = node;
    await new Promise<void>(resolve => {
      finishLocal = resolve; node.onended = () => { finishLocal = null; resolve(); };
      node.start(); handlers.onFirstAudio();
    });
  };
  return {
    id: "minimax-cola-voice", label: MINIMAX_VOICE_LABEL, isMock: false,
    isSpeaking: () => speaking || fallback.isSpeaking(),
    getAmplitude: () => {
      if (usingFallback) return fallback.getAmplitude?.() ?? 0;
      if (usingAvatar || !analyser || !speaking) return 0;
      analyser.getByteTimeDomainData(levels);
      return Math.min(1, Math.max(...levels.map(n => Math.abs(n - 128))) / 128 * 2.2);
    },
    getTimeToFirstAudioMs: () => lastTtfa,
    async speak(req: VoiceRequest, handlers: VoiceHandlers) {
      cancel();
      const gen = generation, started = performance.now();
      controller = new AbortController(); speaking = true; usingFallback = false; usingAvatar = false; lastTtfa = null;
      setVoiceDiagnostics({ browserTtsFallback: false, error: undefined });
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.access_token) throw Error("voice_unauthenticated");
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + "/functions/v1/cola-voice", {
          method: "POST", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]),
          headers: { Authorization: "Bearer " + data.session.access_token,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ text: req.text, language: req.language, speaking_rate: req.lemo.speaking_rate, lemo: req.lemo, stream: false }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok || !payload.audio_base64) {
          if (typeof payload.minimax_voice_id_present === "boolean") setVoiceDiagnostics({ voiceIdConfigured: payload.minimax_voice_id_present });
          throw Error("minimax_provider_error");
        }
        // Decode a complete MP3 exactly once. Never feed MP3 fragments to MuseTalk.
        const audioContext = await ensureCtx();
        const bytes = Uint8Array.from(atob(payload.audio_base64), c => c.charCodeAt(0));
        const audio = await audioContext.decodeAudioData(bytes.buffer);
        if (gen !== generation) return;
        setVoiceDiagnostics({ state: "online", voiceIdConfigured: true, browserTtsFallback: false, error: undefined });
        if (req.lemo.pause_before_ms) await new Promise(resolve => setTimeout(resolve, Math.min(600, req.lemo.pause_before_ms)));
        if (gen !== generation) return;
        usingAvatar = realtimeAvatarBridge.isReady();
        const first = () => { if (gen === generation) { lastTtfa = Math.round(performance.now() - started); handlers.onFirstAudio(); } };
        const rendered = usingAvatar && await realtimeAvatarBridge.speakAudioBuffers([audio], first, { ...req.lemo });
        if (gen !== generation) return;
        if (!rendered) {
          // The client closes/detaches failed remote media before returning false.
          await localPlay(audio, gen, { ...handlers, onFirstAudio: first });
        }
        if (gen === generation) { speaking = false; handlers.onDone(); }
      } catch {
        if (gen !== generation) return;
        stopLocal(); realtimeAvatarBridge.interrupt();
        usingAvatar = false; usingFallback = true;
        setVoiceDiagnostics({ state: "fallback", browserTtsFallback: true, error: "minimax_voice_unavailable" });
        try {
          await fallback.speak(req, { ...handlers, onError: message => {
            setVoiceDiagnostics({ state: "error", error: "browser_tts_failed" }); handlers.onError(message);
          } });
        } catch { setVoiceDiagnostics({ state: "error", error: "browser_tts_failed" }); handlers.onError("Voice unavailable"); }
        finally { speaking = false; setVoiceDiagnostics({ browserTtsFallback: false }); }
      }
    },
    cancel,
    flush: cancel,
  } as VoiceAdapter & { getTimeToFirstAudioMs(): number | null };
}
