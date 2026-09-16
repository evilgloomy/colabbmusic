import { AudioQueue, splitIntoSpeakableChunks } from "@/live/audio/audioQueue";
import type { VoiceAdapter, VoiceHandlers, VoiceRequest } from "@/live/lib/types";

/**
 * MOCK Cola Voice. Uses browser speech synthesis purely as a placeholder so the
 * queue, streaming cadence, cancel/flush and barge-in are all testable. This is
 * NOT Cola's voice; replacing this module with a streaming provider requires no
 * change anywhere else.
 */
export function createMockVoiceAdapter(): VoiceAdapter {
  const queue = new AudioQueue();
  let speaking = false;

  return {
    id: "mock-voice-browser-tts",
    isMock: true,
    isSpeaking: () => speaking,
    async speak(req: VoiceRequest, handlers: VoiceHandlers) {
      speaking = true;
      queue.cancel();
      queue.onFirstAudio = handlers.onFirstAudio;
      queue.onError = handlers.onError;

      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      const chunks = splitIntoSpeakableChunks(req.text);

      await new Promise<void>((resolve) => {
        queue.onDrained = () => {
          speaking = false;
          handlers.onDone();
          resolve();
        };
        // Emotional metadata shapes delivery even in mock mode.
        const rate = Math.max(0.6, Math.min(1.6, req.lemo.speaking_rate || 1));
        const pitch = 1 + (req.lemo.warmth - 0.5) * 0.3;

        chunks.forEach((chunk, idx) => {
          queue.push({
            play: (signal) =>
              new Promise<void>((done, fail) => {
                if (signal.aborted) return done();
                const pause = idx === 0 ? req.lemo.pause_before_ms || 0 : 60;
                const timer = setTimeout(() => {
                  if (signal.aborted) return done();
                  if (!synth) {
                    // No synthesis available: simulate duration.
                    const ms = Math.min(4000, chunk.length * 55);
                    const t = setTimeout(done, ms);
                    signal.addEventListener("abort", () => {
                      clearTimeout(t);
                      done();
                    });
                    return;
                  }
                  const utter = new SpeechSynthesisUtterance(chunk);
                  utter.rate = rate;
                  utter.pitch = pitch;
                  utter.lang = req.language === "zh" ? "zh-HK" : "en-US";
                  utter.onend = () => done();
                  utter.onerror = () => done();
                  signal.addEventListener("abort", () => {
                    try {
                      synth.cancel();
                    } catch {
                      /* noop */
                    }
                    done();
                  });
                  try {
                    synth.speak(utter);
                  } catch (err) {
                    fail(err);
                  }
                }, pause);
                signal.addEventListener("abort", () => {
                  clearTimeout(timer);
                  done();
                });
              }),
          });
        });
      });
    },
    cancel() {
      speaking = false;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* noop */
      }
      queue.cancel();
    },
    flush() {
      queue.flush();
    },
  };
}
