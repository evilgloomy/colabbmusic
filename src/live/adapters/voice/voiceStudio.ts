/** @deprecated Unused. Cola's production voice is MiniMax via minimaxVoice.ts. */
import { supabase } from "@/integrations/supabase/client";
import type { VoiceAdapter, VoiceHandlers, VoiceRequest } from "@/live/lib/types";

/**
 * VoiceStudio — Cola's intended production voice.
 *
 * The browser never holds credentials: every request goes through the
 * `voice-studio` edge function, which owns VOICESTUDIO_API_URL /
 * VOICESTUDIO_API_KEY / VOICESTUDIO_VOICE_ID. Until the provider contract is
 * supplied the proxy answers "not configured" and this adapter delegates to the
 * browser TTS placeholder, so the room keeps working.
 */
export function createVoiceStudioAdapter(fallback: VoiceAdapter): VoiceAdapter {
  let usingFallback = true;
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: AudioBufferSourceNode | null = null;
  let speaking = false;
  const buf = new Uint8Array(64);

  const readLevel = () => {
    if (!analyser) return fallback.getAmplitude?.() ?? 0;
    analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128) / 128);
    return Math.min(1, peak * 1.8);
  };

  const teardown = () => {
    try {
      source?.stop();
    } catch {
      /* noop */
    }
    source = null;
    analyser = null;
    speaking = false;
  };

  return {
    id: "voicestudio",
    label: "VoiceStudio (Cola voice)",
    isMock: false,
    isSpeaking: () => speaking || fallback.isSpeaking(),
    getAmplitude: () => (usingFallback ? (fallback.getAmplitude?.() ?? 0) : readLevel()),
    async speak(req: VoiceRequest, handlers: VoiceHandlers) {
      try {
        const { data, error } = await supabase.functions.invoke("voice-studio", {
          body: {
            text: req.text,
            voice_id: req.voice_id,
            language: req.language,
            speaking_rate: req.lemo.speaking_rate,
            stream: req.stream,
            lemo: req.lemo,
          },
        });
        if (error || !data || (data as any).ok === false) throw new Error("voicestudio_unavailable");

        // Provider wiring lands here once the VoiceStudio contract is supplied:
        // decode/stream the returned audio through `ctx` + `analyser` so the
        // avatar receives real amplitude data.
        usingFallback = false;
        ctx = ctx ?? new AudioContext();
        throw new Error("voicestudio_mapping_pending");
      } catch {
        usingFallback = true;
        teardown();
        await fallback.speak(req, handlers);
      }
    },
    cancel() {
      teardown();
      fallback.cancel();
    },
    flush() {
      fallback.flush();
    },
  };
}
