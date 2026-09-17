// Contract every Cola avatar presentation implements.
// The realtime provider is HeyGen LiveAvatar LITE; the editorial portrait remains
// a no-secrets/no-network fallback. Future providers can use the same surface.

import type { LemoState, LiveState } from "@/live/lib/types";

export interface AvatarViseme {
  /** Phoneme or viseme id from a future realtime voice provider. */
  id: string;
  /** 0-1 weight. */
  weight: number;
  /** ms offset from the start of the current utterance. */
  at_ms?: number;
}

export interface LiveAvatarProps {
  state: LiveState;
  emotion: LemoState | null;
  /** 0-1 outgoing local audio level; realtime video may use provider-native lip sync instead. */
  amplitude: number;
  speaking: boolean;
  listening: boolean;
  /** Partial interviewer transcript, for providers that react to it. */
  partialTranscript?: string;
  /** Optional viseme stream for future local-rendered providers. */
  visemes?: AvatarViseme[];
  className?: string;
}

export type LiveAvatarComponent = (props: LiveAvatarProps) => JSX.Element;

export const AVATAR_PROVIDER_ID = "liveavatar-lite-cola-v1";
export const AVATAR_PROVIDER_LABEL = "LiveAvatar LITE — Cola B · editorial portrait fallback";
