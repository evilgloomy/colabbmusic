// LEMO Lite — server-side emotional delivery metadata. Replaceable by real LEMO.

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number(n.toFixed(2))));

export interface LemoStateOut {
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

export const NEUTRAL: LemoStateOut = {
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

export function analyzeLemo(userText: string, replyText: string): LemoStateOut {
  const text = `${userText} ${replyText}`.toLowerCase();
  const playful = /(haha|funny|fun|laugh|哈|搞笑)/.test(text);
  const tender = /(love|family|home|miss|屋企|愛|掛住)/.test(text);
  const driven = /(tour|release|album|stage|新歌|演出)/.test(text);
  const emotion = playful ? "playful" : tender ? "tender" : driven ? "bright" : "warm";
  const energy = playful ? 0.72 : driven ? 0.68 : tender ? 0.38 : 0.52;
  return {
    emotion,
    valence: clamp01(tender ? 0.55 : playful ? 0.7 : 0.45),
    arousal: clamp01(energy),
    warmth: clamp01(tender ? 0.85 : 0.65),
    confidence: clamp01(driven ? 0.8 : 0.66),
    energy: clamp01(energy),
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
}
