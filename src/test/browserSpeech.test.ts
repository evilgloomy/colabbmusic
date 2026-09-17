import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBrowserSpeechAdapter,
  mergeTranscript,
  speechRecognitionSupported,
} from "@/live/adapters/speech/browserSpeech";

/** Minimal stand-in for the browser SpeechRecognition engine. */
class FakeRecognition {
  static last: FakeRecognition | null = null;
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() {
    FakeRecognition.last = this;
  }
  start() {}
  stop() {}
  emit(items: { transcript: string; isFinal: boolean }[]) {
    const results: any = items.map((i) => {
      const r: any = [{ transcript: i.transcript }];
      r.isFinal = i.isFinal;
      return r;
    });
    results.length = items.length;
    this.onresult?.({ resultIndex: 0, results });
  }
}

const handlers = () => ({
  onSpeechStart: vi.fn(),
  onPartial: vi.fn(),
  onFinal: vi.fn(),
  onError: vi.fn(),
});

describe("browser speech finalization", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (window as any).SpeechRecognition = FakeRecognition;
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    FakeRecognition.last = null;
  });

  it("sends a turn when only interim results arrive before silence", async () => {
    const h = handlers();
    const a = createBrowserSpeechAdapter();
    await a.start(h, { silenceThresholdMs: 100 });
    FakeRecognition.last!.emit([{ transcript: "hello cola", isFinal: false }]);
    vi.advanceTimersByTime(150);
    expect(h.onFinal).toHaveBeenCalledTimes(1);
    expect(h.onFinal.mock.calls[0][0]).toBe("hello cola");
  });

  it("sends a final result exactly once", async () => {
    const h = handlers();
    const a = createBrowserSpeechAdapter();
    await a.start(h, { silenceThresholdMs: 100 });
    FakeRecognition.last!.emit([{ transcript: "how are you", isFinal: true }]);
    vi.advanceTimersByTime(150);
    vi.advanceTimersByTime(300);
    expect(h.onFinal).toHaveBeenCalledTimes(1);
    expect(h.onFinal.mock.calls[0][0]).toBe("how are you");
  });

  it("does not duplicate text when interim is followed by a final", async () => {
    const h = handlers();
    const a = createBrowserSpeechAdapter();
    await a.start(h, { silenceThresholdMs: 100 });
    FakeRecognition.last!.emit([{ transcript: "tell me about", isFinal: false }]);
    FakeRecognition.last!.emit([{ transcript: "tell me about the album", isFinal: true }]);
    vi.advanceTimersByTime(150);
    expect(h.onFinal).toHaveBeenCalledTimes(1);
    expect(h.onFinal.mock.calls[0][0]).toBe("tell me about the album");
  });

  it("reports unsupported recognition so the UI can fall back to typing", async () => {
    delete (window as any).SpeechRecognition;
    const h = handlers();
    const a = createBrowserSpeechAdapter();
    expect(speechRecognitionSupported()).toBe(false);
    await a.start(h, { silenceThresholdMs: 100 });
    expect(h.onError).toHaveBeenCalledTimes(1);
    expect(h.onError.mock.calls[0][0]).toMatch(/^unsupported:/);
  });
});

describe("mergeTranscript", () => {
  it("joins without repeating an overlapping tail", () => {
    expect(mergeTranscript("tell me", "me about it")).toBe("tell me about it");
    expect(mergeTranscript("hello", "")).toBe("hello");
    expect(mergeTranscript("", "hi")).toBe("hi");
  });
});
