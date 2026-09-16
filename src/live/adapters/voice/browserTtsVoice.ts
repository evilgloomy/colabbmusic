import { AudioQueue, splitIntoSpeakableChunks } from "@/live/audio/audioQueue";
import type { VoiceAdapter, VoiceHandlers, VoiceRequest } from "@/live/lib/types";

/**
 * BROWSER TTS PLACEHOLDER — this is NOT Cola's voice.
 * It exists only so the queue, streaming cadence, cancel/flush and barge-in are
 * testable before VoiceStudio is connected. Replacing it changes nothing else.
 */
export function createBrowserTtsPlaceholderAdapter(): VoiceAdapter {
  const queue = new AudioQueue();
  let speaking = false;
  let level = 0;
  let raf = 0;

  const startLevelLoop = (energy: number) => {
    cancelAnimationFrame(raf);
    const tick = () => {
      // No analyser is available for speechSynthesis; produce a tasteful,
      // speech-like envelope instead of pretending to do precise lip sync.
      const t = performance.now() / 1000;
      const base = 0.34 + 0.3 * energy;
      const wobble = Math.sin(t * 9.1) * 0.22 + Math.sin(t * 15.7) * 0.12 + Math.sin(t * 3.3) * 0.1;
      level = Math.max(0.05, Math.min(1, base + wobble));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  const stopLevelLoop = () => {
    cancelAnimationFrame(raf);
    level = 0;
  };

  return {
    id: "browser-tts-placeholder",
    label: "Browser TTS Placeholder",
    isMock: true,
    isSpeaking: () => speaking,
    getAmplitude: () => level,
    async speak(req: VoiceRequest, handlers: VoiceHandlers) {
      speaking = true;
      queue.cancel();
      queue.onFirstAudio = () => {
        startLevelLoop(req.lemo.energy ?? 0.5);
        handlers.onFirstAudio();
      };
      queue.onError = handlers.onError;

      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      const chunks = splitIntoSpeakableChunks(req.text);

      await new Promise<void>((resolve) => {
        queue.onDrained = () => {
          speaking = false;
          stopLevelLoop();
          handlers.onDone();
          resolve();
        };
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
      stopLevelLoop();
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
