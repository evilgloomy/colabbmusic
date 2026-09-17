import type { SpeechInputAdapter, SpeechInputHandlers } from "@/live/lib/types";

/**
 * Browser SpeechRecognition adapter (Chrome/Edge).
 *
 * Finalization contract: some engines never emit an `isFinal` result before the
 * silence timeout fires. We therefore track committed final text AND the latest
 * interim text, and finalize on the best available transcript — never an empty
 * buffer once speech was clearly received.
 */
export function speechRecognitionSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
}

/** Joins committed + interim text without duplicating an overlapping tail. */
export function mergeTranscript(committed: string, interim: string): string {
  const a = committed.trim();
  const b = interim.trim();
  if (!b) return a;
  if (!a) return b;
  if (a.endsWith(b)) return a;
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  const max = Math.min(a.length, b.length);
  for (let n = max; n > 0; n--) {
    if (lowerA.slice(a.length - n) === lowerB.slice(0, n)) return `${a}${b.slice(n)}`.trim();
  }
  return `${a} ${b}`.trim();
}

export function createBrowserSpeechAdapter(): SpeechInputAdapter {
  const SR: any =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  let recognition: any = null;
  let muted = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let committed = "";
  let interim = "";
  let speaking = false;
  let lastPartialAt = 0;
  let handlers: SpeechInputHandlers | null = null;
  let stopped = true;
  let threshold = 750;

  const clearSilence = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = null;
  };

  const resetTurn = () => {
    committed = "";
    interim = "";
    speaking = false;
  };

  const finalize = () => {
    clearSilence();
    const text = mergeTranscript(committed, interim);
    resetTurn();
    if (!text || !handlers) return;
    const finalizationMs = Math.max(0, Math.round(performance.now() - lastPartialAt));
    handlers.onFinal(text, { finalizationMs });
  };

  const armSilence = () => {
    clearSilence();
    silenceTimer = setTimeout(finalize, threshold);
  };

  return {
    id: "browser-speech",
    isMock: false,
    async start(h, options) {
      handlers = h;
      threshold = options?.silenceThresholdMs ?? 750;
      stopped = false;
      resetTurn();
      if (!SR) {
        h.onError("unsupported:This browser does not support live speech recognition. Switching to typed input.");
        return;
      }
      recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options?.language === "zh" ? "zh-HK" : options?.language || "en-US";

      recognition.onresult = (event: any) => {
        if (muted) return;
        let latestInterim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) committed = mergeTranscript(committed, res[0].transcript);
          else latestInterim = mergeTranscript(latestInterim, res[0].transcript);
        }
        interim = latestInterim;
        if (!speaking) {
          speaking = true;
          handlers?.onSpeechStart();
        }
        lastPartialAt = performance.now();
        const preview = mergeTranscript(committed, interim);
        if (preview) handlers?.onPartial(preview);
        armSilence();
      };
      recognition.onerror = (e: any) => {
        if (e?.error === "no-speech" || e?.error === "aborted") return;
        if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
          handlers?.onError("mic-denied:Microphone access was blocked. Allow it in the browser, or use typed input.");
          return;
        }
        handlers?.onError(`Speech input error: ${e?.error ?? "unknown"}`);
      };
      recognition.onend = () => {
        // Some engines end the stream instead of emitting a final result.
        if (committed || interim) finalize();
        if (!stopped) {
          try {
            recognition?.start();
          } catch {
            /* already starting */
          }
        }
      };
      try {
        recognition.start();
      } catch {
        h.onError("Could not start the microphone.");
      }
    },
    async stop() {
      stopped = true;
      clearSilence();
      resetTurn();
      try {
        recognition?.stop();
      } catch {
        /* noop */
      }
      recognition = null;
      handlers = null;
    },
    setMuted(v) {
      muted = v;
      if (v) {
        clearSilence();
        resetTurn();
      }
    },
    isMuted: () => muted,
  };
}
