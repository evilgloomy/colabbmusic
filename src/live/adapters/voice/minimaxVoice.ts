import { supabase } from "@/integrations/supabase/client";
import type { VoiceAdapter, VoiceHandlers, VoiceRequest } from "@/live/lib/types";

/**
 * MiniMaxColaVoiceAdapter — Cola's real voice (MiniMax speech-2.8-turbo).
 *
 * Credentials never reach the browser: audio is streamed from the `cola-voice`
 * edge function as base64 MP3 chunks. Playback runs through an AudioContext +
 * AnalyserNode so LiveColaAvatar receives REAL output amplitude. Cancel/flush
 * stop playback instantly and discard queued audio (barge-in / STOP COLA).
 * The browser TTS placeholder is used only as an emergency fallback.
 */
export const MINIMAX_VOICE_LABEL = "MiniMax Speech 2.8 Turbo — Cola B";

export function createMinimaxColaVoiceAdapter(fallback: VoiceAdapter): VoiceAdapter {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let current: AudioBufferSourceNode | null = null;
  let speaking = false;
  let usingFallback = false;
  let generation = 0;
  let lastTtfa: number | null = null;
  const levels = new Uint8Array(128);

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
    analyser.getByteTimeDomainData(levels);
    let peak = 0;
    for (let i = 0; i < levels.length; i++) peak = Math.max(peak, Math.abs(levels[i] - 128) / 128);
    return Math.min(1, peak * 2.2);
  };

  const stopCurrent = () => {
    try {
      current?.stop();
    } catch {
      /* noop */
    }
    current?.disconnect();
    current = null;
  };

  const base64ToBytes = (b64: string) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  /** Sequential playback queue: each decoded chunk plays right after the previous. */
  const makePlayer = (gen: number) => {
    let tail: Promise<void> = Promise.resolve();
    const enqueue = (audio: AudioBuffer) => {
      tail = tail.then(
        () =>
          new Promise<void>((resolve) => {
            if (gen !== generation || !ctx || !analyser) return resolve();
            const node = ctx.createBufferSource();
            node.buffer = audio;
            node.connect(analyser);
            node.onended = () => resolve();
            current = node;
            node.start();
          }),
      );
      return tail;
    };
    return { enqueue, drained: () => tail };
  };

  const streamFromEdge = async (
    req: VoiceRequest,
    gen: number,
    handlers: VoiceHandlers,
  ): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error("cola_voice_unauthenticated");

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cola-voice`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: req.text,
        language: req.language,
        speaking_rate: req.lemo.speaking_rate,
        stream: true,
        lemo: req.lemo,
      }),
    });
    if (!res.ok || !res.body) throw new Error("cola_voice_unavailable");

    const audioCtx = ensureCtx();
    const player = makePlayer(gen);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let first = true;
    let pendingBytes: Uint8Array | null = null;
    let received = 0;

    const decodeChunk = async (bytes: Uint8Array) => {
      // A rare partial MP3 frame is merged into the next chunk instead of dropped.
      const merged = pendingBytes ? new Uint8Array([...pendingBytes, ...bytes]) : bytes;
      try {
        const audio = await audioCtx.decodeAudioData(merged.buffer.slice(0) as ArrayBuffer);
        pendingBytes = null;
        if (gen !== generation) return;
        if (first) {
          first = false;
          if (req.lemo.pause_before_ms) {
            await new Promise((r) => setTimeout(r, Math.min(600, req.lemo.pause_before_ms)));
          }
          if (gen !== generation) return;
          handlers.onFirstAudio();
        }
        void player.enqueue(audio);
      } catch {
        pendingBytes = merged;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (gen !== generation) {
        void reader.cancel();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const raw = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        if (!raw.startsWith("data:")) continue;
        let evt: { type?: string; audio_base64?: string; ttfa_ms?: number };
        try {
          evt = JSON.parse(raw.slice(5));
        } catch {
          continue;
        }
        if (evt.type === "meta" && typeof evt.ttfa_ms === "number") lastTtfa = evt.ttfa_ms;
        if (evt.type === "error") throw new Error("cola_voice_provider_error");
        if (evt.type === "chunk" && evt.audio_base64) {
          received++;
          await decodeChunk(base64ToBytes(evt.audio_base64));
        }
      }
    }

    if (!received) throw new Error("cola_voice_empty");
    await player.drained();
  };

  return {
    id: "minimax-cola-voice",
    label: MINIMAX_VOICE_LABEL,
    isMock: false,
    isSpeaking: () => speaking || fallback.isSpeaking(),
    getAmplitude: () => (usingFallback ? (fallback.getAmplitude?.() ?? 0) : readLevel()),
    getTimeToFirstAudioMs: () => lastTtfa,
    async speak(req: VoiceRequest, handlers: VoiceHandlers) {
      const gen = ++generation;
      speaking = true;
      usingFallback = false;
      lastTtfa = null;
      try {
        await streamFromEdge(req, gen, handlers);
        if (gen !== generation) return;
        speaking = false;
        handlers.onDone();
      } catch {
        if (gen !== generation) return;
        // Emergency fallback only.
        usingFallback = true;
        stopCurrent();
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
      stopCurrent();
      fallback.cancel();
    },
    flush() {
      generation++;
      stopCurrent();
      fallback.flush();
    },
  } as VoiceAdapter & { getTimeToFirstAudioMs(): number | null };
}
