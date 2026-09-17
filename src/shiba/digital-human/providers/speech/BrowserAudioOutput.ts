import type { AudioChunk, AudioOutput } from "../../contracts/speech";
import { RuntimeError } from "../../contracts/session";
export class BrowserAudioOutput implements AudioOutput {
  private context?: AudioContext;
  private sources = new Set<AudioBufferSourceNode>();
  private tail = 0;
  async prepare() { this.context ??= new AudioContext(); await this.context.resume(); }
  enqueue(chunk: AudioChunk, signal: AbortSignal, onStarted: () => void) {
    signal.throwIfAborted();
    const ctx = this.context!;
    const view = new DataView(chunk.pcm);
    const buffer = ctx.createBuffer(1, chunk.pcm.byteLength / 2, chunk.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = view.getInt16(i * 2, true) / 32768;
    const node = ctx.createBufferSource(); node.buffer = buffer; node.connect(ctx.destination);
    this.sources.add(node);
    const at = Math.max(ctx.currentTime, this.tail); this.tail = at + buffer.duration;
    const timer = setTimeout(() => { if (!signal.aborted) onStarted(); }, Math.max(0, (at - ctx.currentTime) * 1000));
    const abort = () => { clearTimeout(timer); try { node.stop(); } catch {} };
    signal.addEventListener("abort", abort, { once: true });
    node.onended = () => { this.sources.delete(node); node.disconnect(); signal.removeEventListener("abort", abort); };
    node.start(at);
  }
  async drain(signal: AbortSignal) {
    while (this.sources.size) { signal.throwIfAborted(); await new Promise(resolve => setTimeout(resolve, 10)); }
  }
  cancel() {
    for (const node of this.sources) { try { node.stop(); } catch {} node.disconnect(); }
    this.sources.clear(); this.tail = 0;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
  emergency(text: string, language: string, signal: AbortSignal, onStarted: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      signal.throwIfAborted();
      if (typeof speechSynthesis === "undefined") return reject(new RuntimeError("SpeechUnavailable"));
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /^(zh|yue)/i.test(language) ? "zh-HK" : language;
      const abort = () => { speechSynthesis.cancel(); cleanup(); resolve(); };
      const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); };
      const timer = setTimeout(() => { speechSynthesis.cancel(); cleanup(); reject(new RuntimeError("SpeechUnavailable")); }, 45000);
      utterance.onstart = onStarted;
      utterance.onend = () => { cleanup(); resolve(); };
      utterance.onerror = () => { cleanup(); reject(new RuntimeError("SpeechUnavailable")); };
      signal.addEventListener("abort", abort, { once: true });
      speechSynthesis.speak(utterance);
    });
  }
}
