import type { SpeechProvider, AudioChunk } from "../../contracts/speech";
import type { LemoState } from "../../contracts/emotion";
import { RuntimeError } from "../../contracts/session";
export class MiniMaxSpeechProvider implements SpeechProvider {
  readonly id = "minimax";
  constructor(private request: (body: unknown, signal: AbortSignal) => Promise<Response>) {}
  async *synthesize(input: { text: string; emotion: LemoState; language: string; signal: AbortSignal }): AsyncIterable<AudioChunk> {
    const response = await this.request({ text: input.text, lemo: input.emotion, language: input.language,
      stream: true, format: "pcm" }, input.signal);
    if (!response.ok || !response.body) throw new RuntimeError("SpeechUnavailable");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "", count = 0, complete = false;
    try {
      while (true) {
        input.signal.throwIfAborted();
        const { value, done } = await reader.read();
        pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
        const lines = pending.split(/\r?\n/); pending = lines.pop()!;
        if (done && pending) { lines.push(pending); pending = ""; }
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const event = JSON.parse(line.slice(5));
          if (event.type === "error") throw new RuntimeError("SpeechUnavailable");
          if (event.type === "done") complete = true;
          if (event.type === "chunk" && event.audio_base64) {
            const raw = atob(event.audio_base64);
            const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
            if (bytes.length % 2) throw new RuntimeError("SpeechUnavailable");
            count++; yield { pcm: bytes.buffer, sampleRate: 16000 };
          }
        }
        if (done) break;
      }
      if (!count || !complete) throw new RuntimeError("SpeechUnavailable");
    } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
  }
}
