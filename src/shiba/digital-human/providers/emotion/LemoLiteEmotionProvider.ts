import { NEUTRAL, type EmotionProvider, type LemoState } from "../../contracts/emotion";
export class LemoLiteEmotionProvider implements EmotionProvider {
  readonly id = "lemo-lite";
  async analyze(input: { supplied?: LemoState }): Promise<LemoState> {
    const state = { ...NEUTRAL, ...input.supplied };
    for (const key of ["valence", "arousal", "warmth", "confidence", "energy"] as const)
      state[key] = Number.isFinite(state[key]) ? Math.max(key === "valence" ? -1 : 0, Math.min(1, state[key])) : NEUTRAL[key];
    state.speaking_rate = Number.isFinite(state.speaking_rate) ? Math.max(.5, Math.min(2, state.speaking_rate)) : 1;
    state.pause_before_ms = Number.isFinite(state.pause_before_ms) ? Math.max(0, Math.min(600, state.pause_before_ms)) : 120;
    return state;
  }
}
