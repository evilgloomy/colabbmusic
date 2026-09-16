import type { SpeechInputAdapter, SpeechInputHandlers } from "@/live/lib/types";

/**
 * Browser SpeechRecognition adapter (Chrome/Edge). Provides partial + final
 * transcripts and a configurable silence threshold for turn detection.
 * Swappable: a realtime provider can implement the same interface later.
 */
export function createBrowserSpeechAdapter(): SpeechInputAdapter {
  const SR: any =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  let recognition: any = null;
  let muted = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingText = "";
  let speechStartedAt = 0;
  let lastPartialAt = 0;
  let handlers: SpeechInputHandlers | null = null;
  let stopped = true;
  let threshold = 750;

  const clearSilence = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = null;
  };

  const finalize = () => {
    clearSilence();
    const text = pendingText.trim();
    pendingText = "";
    if (!text || !handlers) return;
    const finalizationMs = Math.max(0, Math.round(performance.now() - lastPartialAt));
    handlers.onFinal(text, { finalizationMs });
  };

  return {
    id: "browser-speech",
    isMock: false,
    async start(h, options) {
      handlers = h;
      threshold = options?.silenceThresholdMs ?? 750;
      stopped = false;
      if (!SR) {
        h.onError("This browser does not support live speech recognition. Use Chrome, or switch on simulated speech.");
        return;
      }
      recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options?.language === "zh" ? "zh-HK" : options?.language || "en-US";

      recognition.onresult = (event: any) => {
        if (muted) return;
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) pendingText += res[0].transcript;
          else interim += res[0].transcript;
        }
        if (!speechStartedAt) {
          speechStartedAt = performance.now();
          handlers?.onSpeechStart();
        }
        lastPartialAt = performance.now();
        handlers?.onPartial((pendingText + " " + interim).trim());
        clearSilence();
        silenceTimer = setTimeout(() => {
          speechStartedAt = 0;
          finalize();
        }, threshold);
      };
      recognition.onerror = (e: any) => {
        if (e?.error === "no-speech" || e?.error === "aborted") return;
        handlers?.onError(`Speech input error: ${e?.error ?? "unknown"}`);
      };
      recognition.onend = () => {
        if (!stopped) {
          try {
            recognition.start();
          } catch {
            /* already starting */
          }
        }
      };
      try {
        recognition.start();
      } catch (err) {
        h.onError("Could not start the microphone.");
      }
    },
    async stop() {
      stopped = true;
      clearSilence();
      pendingText = "";
      try {
        recognition?.stop();
      } catch {
        /* noop */
      }
      recognition = null;
    },
    setMuted(v) {
      muted = v;
      if (v) {
        clearSilence();
        pendingText = "";
      }
    },
    isMuted: () => muted,
  };
}
