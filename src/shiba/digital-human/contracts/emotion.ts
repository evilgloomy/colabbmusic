export interface LemoState {
  emotion: string; valence: number; arousal: number; warmth: number;
  confidence: number; energy: number; speaking_rate: number; pause_before_ms: number;
  delivery_note: string; is_fallback: boolean;
}
export const NEUTRAL: LemoState = { emotion: "neutral", valence: 0, arousal: .35, warmth: .5,
  confidence: .6, energy: .5, speaking_rate: 1, pause_before_ms: 120, delivery_note: "", is_fallback: true };
export interface EmotionProvider {
  id: string;
  analyze(input: { userText: string; replyText: string; supplied?: LemoState }): Promise<LemoState>;
}
