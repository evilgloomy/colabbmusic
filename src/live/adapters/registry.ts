import { createBrowserSpeechAdapter } from "./speech/browserSpeech";
import { createMockSpeechAdapter } from "./speech/mockSpeech";
import type { SpeechInputAdapter } from "../lib/types";
export type SpeechMode = "browser" | "simulated";
export function getSpeechAdapter(mode: SpeechMode): SpeechInputAdapter {
  return mode === "simulated" ? createMockSpeechAdapter() : createBrowserSpeechAdapter();
}
export const LIVE_MOCK_MODE = false;
