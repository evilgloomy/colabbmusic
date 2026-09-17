import type { LemoState } from "./emotion";
export interface Message { role: "interviewer" | "cola"; content: string }
export interface BrainInput {
  character_id: string; session_id: string; mode: string; user_text: string;
  conversation_history: Message[]; interrupted_previous_turn: boolean;
  speech_finalization_ms?: number;
}
export interface BrainOutput {
  reply_text: string; response_id: string; provider: string; model: string;
  lemo?: LemoState; metadata?: Record<string, unknown>;
  latency?: Record<string, number>; mock?: boolean;
}
/** Browser-facing Aurora boundary; system prompts and private context stay on server. */
export interface BrainProvider { id: string; generate(input: BrainInput, signal: AbortSignal): Promise<BrainOutput> }
