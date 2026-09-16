import type { SpeechInputAdapter, SpeechInputHandlers } from "@/live/lib/types";

/**
 * MOCK speech input. Text typed (or injected by the producer) is replayed with
 * realistic partial/final timing so the whole pipeline can be exercised with no
 * microphone and no provider credentials.
 */
export function createMockSpeechAdapter(): SpeechInputAdapter {
  let handlers: SpeechInputHandlers | null = null;
  let muted = false;
  let threshold = 750;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const clear = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  return {
    id: "mock-speech",
    isMock: true,
    async start(h, options) {
      handlers = h;
      threshold = options?.silenceThresholdMs ?? 750;
    },
    async stop() {
      clear();
      handlers = null;
    },
    setMuted(v) {
      muted = v;
      if (v) clear();
    },
    isMuted: () => muted,
    simulate(text: string) {
      if (!handlers || muted) return;
      clear();
      const words = text.trim().split(/\s+/);
      const perWord = 90;
      handlers.onSpeechStart();
      words.forEach((_, i) => {
        timers.push(
          setTimeout(() => {
            handlers?.onPartial(words.slice(0, i + 1).join(" "));
          }, perWord * (i + 1)),
        );
      });
      const speechEnd = perWord * (words.length + 1);
      timers.push(
        setTimeout(() => {
          handlers?.onFinal(text.trim(), { finalizationMs: threshold });
        }, speechEnd + threshold),
      );
    },
  };
}
