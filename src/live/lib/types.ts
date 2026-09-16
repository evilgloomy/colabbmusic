// Cola Live — shared types for the private interview MVP.
// Everything here is provider-agnostic: adapters implement these contracts.

export type LiveState =
  | "IDLE"
  | "CONNECTING"
  | "LISTENING"
  | "USER_SPEAKING"
  | "FINALIZING_TRANSCRIPT"
  | "AURORA_PROCESSING"
  | "LEMO_PROCESSING"
  | "VOICE_CONNECTING"
  | "COLA_SPEAKING"
  | "INTERRUPTED"
  | "ERROR";

export type LiveRole = "admin" | "producer" | "guest";

export type TurnRole = "interviewer" | "cola" | "system";

export interface TranscriptTurn {
  id: string;
  role: TurnRole;
  content: string;
  isFinal: boolean;
  interrupted: boolean;
  source?: string;
  createdAt: string;
}

export interface LemoState {
  emotion: string;
  valence: number;
  arousal: number;
  warmth: number;
  confidence: number;
  energy: number;
  speaking_rate: number;
  pause_before_ms: number;
  delivery_note: string;
  is_fallback: boolean;
}

export const NEUTRAL_LEMO: LemoState = {
  emotion: "neutral",
  valence: 0,
  arousal: 0.35,
  warmth: 0.5,
  confidence: 0.6,
  energy: 0.5,
  speaking_rate: 1,
  pause_before_ms: 120,
  delivery_note: "Neutral fallback delivery.",
  is_fallback: true,
};

export interface LatencySample {
  speech_finalization_ms?: number;
  aurora_ms?: number;
  lemo_ms?: number;
  voice_ttfa_ms?: number;
  total_ms?: number;
}

export type ServiceKey = "speech" | "aurora" | "lemo" | "voice" | "avatar";
export type ServiceHealth = "unknown" | "mock" | "ok" | "degraded" | "down";
export type ServiceStatusMap = Record<ServiceKey, { health: ServiceHealth; note?: string }>;

export interface LiveSessionConfig {
  id: string;
  title: string;
  media_organization?: string | null;
  interviewer_name?: string | null;
  primary_language: string;
  status: string;
  silence_threshold_ms: number;
  mock_mode?: boolean;
}

/* ---------------------------------- Adapters --------------------------------- */

export interface SpeechInputHandlers {
  onSpeechStart: () => void;
  onPartial: (text: string) => void;
  onFinal: (text: string, meta: { finalizationMs: number }) => void;
  onError: (message: string) => void;
}

export interface SpeechInputAdapter {
  readonly id: string;
  readonly isMock: boolean;
  start(handlers: SpeechInputHandlers, options?: { silenceThresholdMs?: number; language?: string }): Promise<void>;
  stop(): Promise<void>;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Test affordance: feed text as if it had been spoken (mock adapters only). */
  simulate?(text: string): void;
}

export interface AuroraRequest {
  session_id: string;
  character_id: "cola_b";
  mode: "live_interview";
  user_text: string;
  conversation_history: { role: TurnRole; content: string }[];
  interrupted_previous_turn: boolean;
  speech_finalization_ms?: number;
}

export interface AuroraResult {
  reply_text: string;
  /** Engine that produced the reply, e.g. "aurora-lite" or "aurora". */
  engine?: string;
  lemo?: LemoState;
  metadata?: Record<string, unknown>;
  memory_refs?: string[];
  message_id?: string;
  latency?: LatencySample;
  mock: boolean;
}

export interface AuroraAdapter {
  readonly id: string;
  readonly isMock: boolean;
  generate(req: AuroraRequest): Promise<AuroraResult>;
}

export interface LemoAdapter {
  readonly id: string;
  readonly isMock: boolean;
  analyze(input: { session_id: string; user_text: string; reply_text: string }): Promise<LemoState>;
}

export interface VoiceHandlers {
  onFirstAudio: () => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export interface VoiceRequest {
  text: string;
  voice_id: string;
  lemo: LemoState;
  stream: boolean;
  language?: string;
}

export interface VoiceAdapter {
  readonly id: string;
  /** Human label shown in producer diagnostics. */
  readonly label?: string;
  readonly isMock: boolean;
  speak(req: VoiceRequest, handlers: VoiceHandlers): Promise<void>;
  cancel(): void;
  flush(): void;
  isSpeaking(): boolean;
  /** 0-1 outgoing audio level for the avatar, when the provider exposes it. */
  getAmplitude?(): number;
}
