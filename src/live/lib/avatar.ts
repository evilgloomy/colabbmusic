import type { LemoState, LiveState } from "@/live/lib/types";

export interface AvatarViseme {
  /** Phoneme or viseme id from a future realtime voice provider. */
  id: string;
  /** 0-1 weight. */
  weight: number;
  /** ms offset from the start of the current utterance. */
  at_ms?: number;
}

export interface ColaAvatarProps {
  avatar: import("@/shiba/digital-human/contracts/avatar").AvatarProvider;
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

export type ColaAvatarComponent = (props: ColaAvatarProps) => JSX.Element;

export const AVATAR_PROVIDER_ID = "shiba-native";
export const AVATAR_PROVIDER_LABEL = "Shiba Native Avatar · editorial portrait fallback";
