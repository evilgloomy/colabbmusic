import type { LemoState } from "./emotion";
export type AvatarState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";
export interface AvatarStatus {
  status: "idle" | "connecting" | "connected" | "speaking" | "fallback";
  streamReady: boolean; reason?: string; metrics?: Record<string, string | number | null>;
}
export interface AvatarProvider {
  id: string; connect(): Promise<void>; disconnect(): Promise<void>;
  beginUtterance(input: { id: string; emotion: LemoState }, signal: AbortSignal, onStarted: () => void): Promise<void>;
  pushAudio(chunk: ArrayBuffer, signal: AbortSignal): Promise<void>;
  endUtterance(signal: AbortSignal): Promise<void>;
  interrupt(): void; setState(state: AvatarState): void;
  attachVideo(element: HTMLVideoElement | null): void;
  getStatus(): AvatarStatus; subscribe(fn: () => void): () => void;
}
