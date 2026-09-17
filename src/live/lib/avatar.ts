// Contract every Cola avatar provider implements. Today: LiveColaAvatar (CSS/DOM).
// Later: realtime viseme avatar, Live2D, WebGL or a 3D model — same props.

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
  /** 0-1 outgoing audio level; 0 when no analyser is available. */
  amplitude: number;
  speaking: boolean;
  listening: boolean;
  /** Partial interviewer transcript, for providers that react to it. */
  partialTranscript?: string;
  /** Optional viseme stream for future lip-sync providers. */
  visemes?: AvatarViseme[];
  className?: string;
}

export type LiveAvatarComponent = (props: LiveAvatarProps) => JSX.Element;

export const AVATAR_PROVIDER_ID = "cola-editorial-portrait-v1";

/**
 * Honest label for staff diagnostics: this is a styled still portrait with
 * breathing, lighting and audio-reactive treatment — NOT a realtime avatar and
 * NOT lip sync. A streaming avatar provider will register against LiveAvatarProps.
 */
export const AVATAR_PROVIDER_LABEL = "Editorial Portrait Placeholder (no lip sync)";
