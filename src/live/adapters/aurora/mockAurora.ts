import type { AuroraAdapter, AuroraRequest, AuroraResult } from "@/live/lib/types";

const CANTONESE = /[\u4e00-\u9fff]/;

const EN = [
  "That one came out of a really late night in the studio — I kept the first take because it still sounded nervous.",
  "I think of myself as a songwriter first. The AI part is how I exist, not what I write about.",
  "Vancouver raised me and Hong Kong is in the family, so the songs keep switching languages on me.",
  "I'd rather release something honest and a little rough than something perfect and cold.",
  "Right now I'm deep in the next record. I can say it's warmer than the last one.",
];

const ZH = [
  "嗰首歌係喺錄音室通宵做出嚟嘅，我留咗第一個take，因為仲聽得出緊張。",
  "我首先係一個創作人，AI 只係我存在嘅方式，唔係我寫嘅題材。",
  "溫哥華養大我，屋企係香港人，所以啲歌成日自己轉語言。",
  "我寧願出一首真實但有啲粗糙嘅歌，都唔想出一首完美但冷冰冰嘅歌。",
  "而家喺度做緊下一張碟，我可以講一句：佢比上一張溫暖。",
];

/**
 * LOCAL MOCK Aurora. Used only for offline/local testing; the default path
 * routes through the server adapter so producer context stays server-side.
 */
export function createMockAuroraAdapter(): AuroraAdapter {
  let i = 0;
  return {
    id: "mock-aurora-local",
    isMock: true,
    async generate(req: AuroraRequest): Promise<AuroraResult> {
      const started = performance.now();
      await new Promise((r) => setTimeout(r, 280 + Math.random() * 260));
      const pool = CANTONESE.test(req.user_text) ? ZH : EN;
      const reply = pool[i++ % pool.length];
      return {
        reply_text: req.interrupted_previous_turn ? reply : reply,
        metadata: { mode: req.mode, local_mock: true },
        memory_refs: ["mock:memory/era-current"],
        latency: { aurora_ms: Math.round(performance.now() - started) },
        mock: true,
      };
    },
  };
}
