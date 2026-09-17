import type { LemoState } from "./emotion";
/** Signed little endian 16-bit, mono, 16 kHz. Network chunk boundaries carry no timing semantics. */
export interface AudioChunk { pcm: ArrayBuffer; sampleRate: 16000 }
export interface SpeechProvider {
  id: string;
  synthesize(input: { text: string; emotion: LemoState; language: string; signal: AbortSignal }): AsyncIterable<AudioChunk>;
}
export interface AudioOutput {
  prepare(): Promise<void>;
  enqueue(chunk: AudioChunk, signal: AbortSignal, onStarted: () => void): void;
  drain(signal: AbortSignal): Promise<void>;
  cancel(): void;
  emergency(text: string, language: string, signal: AbortSignal, onStarted: () => void): Promise<void>;
}
export interface Microphone {
  start(handlers: { onSpeechStart(): void; onPartial(text: string): void;
    onFinal(text: string, meta: { finalizationMs: number }): void; onError(message: string): void },
    options?: { language?: string; silenceThresholdMs?: number }): Promise<void>;
  stop(): Promise<void>; setMuted(value: boolean): void; simulate?(text: string): void;
}
