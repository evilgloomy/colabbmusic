import type { LemoState } from "./emotion";
import type { BrainOutput } from "./brain";
import type { AvatarState } from "./avatar";
export type ErrorCode = "BrainUnavailable" | "SpeechUnavailable" | "AvatarUnavailable" | "MicrophoneUnavailable" | "SessionExpired" | "NetworkUnavailable";
export class RuntimeError extends Error { constructor(public code: ErrorCode) { super(code); this.name = "RuntimeError"; } }
export function normalizeError(error: unknown, code: ErrorCode): RuntimeError {
  return error instanceof RuntimeError ? error : new RuntimeError(code);
}
export type RuntimeEvent =
  | { type: "state"; state: AvatarState }
  | { type: "user.speech.partial" | "user.speech.final"; text: string }
  | { type: "brain.completed"; result: BrainOutput }
  | { type: "emotion.updated"; emotion: LemoState }
  | { type: "telemetry"; metrics: RuntimeTelemetry }
  | { type: "runtime.error"; error: RuntimeError }
  | { type: "session.connected" | "session.disconnected" | "user.speech.started" | "brain.started" | "speech.started" | "speech.chunk" | "speech.completed" | "avatar.ready" | "avatar.frame" | "avatar.speaking.started" | "avatar.speaking.completed" | "session.interrupted" };
/** Missing measurements stay absent, never zero-filled. TTFT requires provider streaming. */
export interface RuntimeTelemetry {
  speech_finalization_ms?: number; brain_ms?: number; brain_ttft_ms?: number; aurora_ms?: number;
  lemo_ms?: number; voice_ttfa_ms?: number; total_ms?: number; avatar_first_frame_ms?: number;
  render_start_ms?: number; speech_to_frame_ms?: number; interrupt_local_ms?: number;
}
