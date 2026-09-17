import { supabase } from "@/integrations/supabase/client";
import { splitIntoSpeakableChunks } from "@/live/audio/audioQueue";
import type { VoiceAdapter, VoiceHandlers, VoiceRequest } from "@/live/lib/types";

/**
 * Cola Voice (MiniMax) — the production voice adapter.
 *
 * Credentials never reach the browser: every request goes through the
 * `cola-voice` edge function. Audio is decoded through an AudioContext with an
 * analyser so LiveColaAvatar receives real amplitude. If the provider fails we
 * fall back to the browser TTS placeholder so the room keeps working.
 */
export function createMinimaxVoiceAdapter(fallback: VoiceAdapter): VoiceAdapter {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: AudioBufferSourceNode | null = null;
  let speaking = false;
  let usingFallback = false;
  let generation = 0;
  const buf = new Uint8Array(128);

  const ensureCtx = () => {
    if (!ctx) {
      ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const readLevel = () => {
    if (!analyser || !speaking) return 0;
    analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128) / 128);
    return Math.min(1, peak * 2.2);
  };

  const stopSource = () => {
    try {
      source?.stop();
    } catch {
      /* noop */
    }
    source?.disconnect();
    source = null;
  };

  const base64ToBytes = (b64: string) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  const synthesize = async (req: VoiceRequest, text: string): Promise<ArrayBuffer> => {
    const { data, error } = await supabase.functions.invoke("cola-voice", {
      body: {
        text,
        voice_id: req.voice_id || undefined,
        language: req.language,
        speaking_rate: req.lemo.speaking_rate,
        stream: false,
        lemo: req.lemo,
      },
    });
    const payload = data as { ok?: boolean; audio_base64?: string } | null;
    if (error || !payload?.ok || !payload.audio_base64) throw new Error("cola_voice_unavailable");
    return base64ToBytes(payload.audio_base64).buffer;
  };

  const playBuffer = (audio: AudioBuffer, gen: number) =>
    new Promise<void>((resolve) => {
      if (gen !== generation || !ctx || !analyser) return resolve();
      const node = ctx.createBufferSource();
      node.buffer = audio;
      node.connect(analyser);
      node.onended = () => resolve();
      source = node;
      node.start();
    });

  return {
    id: "cola-voice-minimax",
    label: "Cola Voice (MiniMax)",
    isMock: false,
    isSpeaking: () => speaking || fallback.isSpeaking(),
    getAmplitude: () => (usingFallback ? (fallback.getAmplitude?.() ?? 0) : readLevel()),
    async speak(req: VoiceRequest, handlers: VoiceHandlers) {
      const gen = ++generation;
      speaking = true;
      usingFallback = false;
      let first = true;

      try {
        const audioCtx = ensureCtx();
        const chunks = splitIntoSpeakableChunks(req.text);
        // Pipeline: synthesize the next chunk while the current one plays.
        let pending: Promise<ArrayBuffer> | null = synthesize(req, chunks[0]);

        for (let i = 0; i < chunks.length; i++) {
          if (gen !== generation) return;
          const raw = await pending!;
          pending = i + 1 < chunks.length ? synthesize(req, chunks[i + 1]) : null;
          if (gen !== generation) return;
          const decoded = await audioCtx.decodeAudioData(raw.slice(0));
          if (gen !== generation) return;
          if (first) {
            first = false;
            if (req.lemo.pause_before_ms) {
              await new Promise((r) => setTimeout(r, Math.min(600, req.lemo.pause_before_ms)));
              if (gen !== generation) return;
            }
            handlers.onFirstAudio();
          }
          await playBuffer(decoded, gen);
        }

        if (gen !== generation) return;
        speaking = false;
        handlers.onDone();
      } catch {
        if (gen !== generation) return;
        usingFallback = true;
        stopSource();
        try {
          await fallback.speak(req, handlers);
        } finally {
          speaking = false;
        }
      }
    },
    cancel() {
      generation++;
      speaking = false;
      stopSource();
      fallback.cancel();
    },
    flush() {
      generation++;
      stopSource();
      fallback.flush();
    },
  };
}
