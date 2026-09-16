import type { LemoAdapter, LemoState } from "@/live/lib/types";
import { NEUTRAL_LEMO } from "@/live/lib/types";

const clamp = (n: number) => Math.max(0, Math.min(1, Number(n.toFixed(2))));

/** MOCK LEMO: heuristic emotional state so the delivery panel is exercised. */
export function createMockLemoAdapter(): LemoAdapter {
  return {
    id: "mock-lemo",
    isMock: true,
    async analyze({ user_text, reply_text }): Promise<LemoState> {
      await new Promise((r) => setTimeout(r, 90 + Math.random() * 120));
      const text = `${user_text} ${reply_text}`.toLowerCase();
      const playful = /(haha|funny|fun|laugh|哈|搞笑)/.test(text);
      const tender = /(love|family|home|miss|屋企|愛|掛住)/.test(text);
      const driven = /(tour|release|album|stage|新歌|演出)/.test(text);
      const emotion = playful ? "playful" : tender ? "tender" : driven ? "bright" : "warm";
      const energy = playful ? 0.72 : driven ? 0.68 : tender ? 0.38 : 0.52;
      return {
        emotion,
        valence: clamp(tender ? 0.55 : playful ? 0.7 : 0.45),
        arousal: clamp(energy),
        warmth: clamp(tender ? 0.85 : 0.65),
        confidence: clamp(driven ? 0.8 : 0.66),
        energy: clamp(energy),
        speaking_rate: Number((playful ? 1.06 : tender ? 0.94 : 1).toFixed(2)),
        pause_before_ms: tender ? 260 : 120,
        delivery_note:
          emotion === "tender"
            ? "Soft, slower, let the sentence settle."
            : emotion === "playful"
              ? "Light and quick, small smile in the voice."
              : "Warm, conversational, interview pace.",
        is_fallback: false,
      };
    },
  };
}

export const neutralLemo = (): LemoState => ({ ...NEUTRAL_LEMO });
