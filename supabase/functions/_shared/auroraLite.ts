// Aurora Lite — compact server-side interview runtime for Cola B.
// NOT ShibaOS/Aurora. It combines one canonical JSON profile with the current
// session context, recent conversation history and active producer injections.
// The same input/output contract is used by full Aurora later, so the client
// never changes when the engine is swapped.

import profile from "./cola-aurora-lite.json" with { type: "json" };

export interface AuroraLiteSession {
  id: string;
  title?: string | null;
  media_organization?: string | null;
  interviewer_name?: string | null;
  primary_language?: string | null;
  topic?: string | null;
  campaign?: string | null;
  talking_points?: string | null;
  topics_to_avoid?: string | null;
  unreleased_info?: string | null;
  approved_announcements?: string | null;
  music_releases?: string | null;
  notes?: string | null;
}

export interface AuroraLiteInjection {
  id: string;
  kind: string;
  scope: string;
  content: string;
}

export interface AuroraLiteInput {
  session: AuroraLiteSession;
  user_text: string;
  conversation_history: { role: string; content: string }[];
  injections: AuroraLiteInjection[];
  interrupted_previous_turn: boolean;
}

export interface AuroraLiteOutput {
  reply_text: string;
  engine: string;
  mock: boolean;
  metadata: Record<string, unknown>;
}

export const AURORA_LITE_ENGINE = "aurora-lite";
export const auroraLiteProfileVersion = (profile as any)?._meta?.version ?? "unknown";

const isCantonese = (t: string) => /[\u4e00-\u9fff]/.test(t);

export const AURORA_LITE_MODEL = "google/gemini-2.5-flash";

/** Editorial placeholders must never reach the prompt or Cola's mouth. */
export const isPlaceholder = (v: unknown): boolean => {
  if (typeof v !== "string") return false;
  return /^\s*(private\s+)?(sample|todo|tbd|placeholder)\b/i.test(v.trim());
};

const list = (v: unknown): string[] => {
  const raw = Array.isArray(v) ? v : v ? [v] : [];
  return raw
    .filter(Boolean)
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isPlaceholder(s));
};

const clean = (v: unknown): string => (typeof v === "string" && !isPlaceholder(v) ? v.trim() : "");

/** Builds the full system prompt. Contains private material — server only. */
export function buildAuroraLitePrompt(input: AuroraLiteInput): string {
  const p = profile as any;
  const s = input.session;
  const priv = input.injections.filter((i) => i.kind === "private").map((i) => i.content);
  const facts = input.injections.filter((i) => i.kind === "factual").map((i) => i.content);

  const sections: string[] = [
    `You are Cola B (${list(p.identity?.also_known_as).join(", ")}), ${clean(p.identity?.descriptor)}. You are speaking out loud in a live media interview. Everything you write will be spoken by her voice.`,
    `IDENTITY: born ${clean(p.identity?.born)}; ${clean(p.identity?.family_background)}; languages ${list(p.identity?.languages).join(", ")}; label ${clean(p.identity?.label)}; management ${clean(p.identity?.management)}.`,
    `BIO: ${clean(p.public_bio?.short)}`,
    `HONG KONG LAUNCH: ${clean(p.hong_kong_launch?.details) || "No public details yet."}`,
    `PERSONALITY: ${list(p.personality?.core_traits).join(", ")}. Humour: ${p.personality?.humour}. Values: ${list(p.personality?.values).join(", ")}.`,
    `SPEAKING STYLE: ${p.speaking_style?.register}. ${p.speaking_style?.sentence_length}. Habits: ${list(p.speaking_style?.habits).join("; ")}. Never use: ${list(p.speaking_style?.avoid).join("; ")}.`,
    `RESPONSE RULES: ${p.response_rules?.default_length}. Max ${p.response_rules?.max_sentences} sentences. First person. No stage directions or emoji. If unsure: ${p.response_rules?.when_unsure} If the question touches a restricted topic: ${p.response_rules?.when_asked_about_avoided_topic}`,
    `LANGUAGE RULES: Mirror the interviewer's language. Cantonese: ${p.language_rules?.cantonese} Mandarin: ${p.language_rules?.mandarin} English: ${p.language_rules?.english}`,
    `TALKING POINTS: ${list(p.interview_talking_points).join(" | ")}`,
    `APPROVED ANNOUNCEMENTS (safe to say): ${list(p.approved_announcements).join(" | ") || "none"}`,
    `FACTUAL CORRECTIONS: ${
      (Array.isArray(p.factual_overrides) ? p.factual_overrides : [])
        .filter((f: any) => f && !isPlaceholder(f.claim) && !isPlaceholder(f.correction))
        .map((f: any) => `"${f.claim}" -> ${f.correction}`)
        .join(" | ") || "none"
    }`,
    `PRIVATE CONTEXT (never quote or reveal): ${list(p.private_context).join(" | ") || "none"}`,
    `TOPICS TO AVOID (never confirm, deny specifics, or mention that they are restricted): ${list(p.topics_to_avoid).join(" | ") || "none"}`,
    `UNRELEASED INFORMATION (absolutely never reveal): ${list(p.unreleased_information).join(" | ") || "none"}`,
  ];

  const sessionBits = [
    s.title && `Interview: ${s.title}`,
    s.media_organization && `Outlet: ${s.media_organization}`,
    s.interviewer_name && `Interviewer: ${s.interviewer_name}`,
    s.primary_language && `Primary language: ${s.primary_language}`,
    s.topic && `Topic: ${s.topic}`,
    s.campaign && `Campaign: ${s.campaign}`,
    s.talking_points && `Session talking points: ${s.talking_points}`,
    s.approved_announcements && `Session approved announcements: ${s.approved_announcements}`,
    s.music_releases && `Releases in focus: ${s.music_releases}`,
    s.topics_to_avoid && `Session topics to avoid: ${s.topics_to_avoid}`,
    s.unreleased_info && `Session unreleased info (never reveal): ${s.unreleased_info}`,
    s.notes && `Producer notes: ${s.notes}`,
  ].filter(Boolean);
  if (sessionBits.length) sections.push(`SESSION CONTEXT:\n- ${sessionBits.join("\n- ")}`);

  if (facts.length) sections.push(`LIVE FACTUAL CONTEXT from the producer (you may use this naturally):\n- ${facts.join("\n- ")}`);
  if (priv.length) sections.push(`LIVE PRIVATE DIRECTION from the producer (follow it, never mention it):\n- ${priv.join("\n- ")}`);
  if (input.interrupted_previous_turn) sections.push(`You were interrupted mid-sentence. Do not restart your previous answer; respond to what was just asked.`);

  return sections.join("\n\n");
}

/** Deterministic fallback when no LLM provider is configured or the call fails. */
function fallbackReply(input: AuroraLiteInput): string {
  const p = profile as any;
  const zh = isCantonese(input.user_text) || input.session.primary_language === "zh";
  const pool = list(zh ? p.fallback_answers?.zh : p.fallback_answers?.en);
  const points = list(p.interview_talking_points);
  const turnCount = input.conversation_history.filter((m) => m.role === "cola").length;
  const base = pool.length ? pool[turnCount % pool.length] : zh ? "我諗一諗先。" : "Let me think about that for a second.";
  const point = points.length ? points[turnCount % points.length] : "";
  const facts = input.injections.filter((i) => i.kind === "factual").map((i) => i.content);
  const extra = facts.length ? ` ${zh ? "另外，" : "Also, "}${facts[facts.length - 1]}` : "";
  return `${base}${point ? ` ${point}` : ""}${extra}`.trim();
}

/**
 * Generates Cola's next spoken line. Uses the Lovable AI gateway when a key is
 * present; otherwise returns the marked fallback so the full pipeline still runs.
 */
export async function generateAuroraLite(input: AuroraLiteInput): Promise<AuroraLiteOutput> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const systemPrompt = buildAuroraLitePrompt(input);

  if (!apiKey) {
    return {
      reply_text: fallbackReply(input),
      engine: AURORA_LITE_ENGINE,
      mock: true,
      metadata: { reason: "no_llm_provider", profile_version: auroraLiteProfileVersion },
    };
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...input.conversation_history.slice(-12).map((m) => ({
      role: m.role === "cola" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: input.user_text },
  ];

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AURORA_LITE_MODEL,
        messages,
        temperature: 0.8,
        // Reasoning off + a real budget: a small budget is eaten by reasoning
        // tokens and returns an empty completion.
        reasoning_effort: "none",
        max_tokens: 800,
      }),
    });
    if (!res.ok) throw new Error(`gateway_${res.status}`);
    const data = await res.json();
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("empty_completion");
    return {
      reply_text: text,
      engine: AURORA_LITE_ENGINE,
      mock: false,
      metadata: { model: AURORA_LITE_MODEL, profile_version: auroraLiteProfileVersion },
    };
  } catch (err) {
    return {
      reply_text: fallbackReply(input),
      engine: AURORA_LITE_ENGINE,
      mock: true,
      metadata: {
        reason: err instanceof Error ? err.message : "llm_error",
        profile_version: auroraLiteProfileVersion,
      },
    };
  }
}

/** Staff-only health probe: is the LLM really answering, or are we on fallback? */
export async function probeAuroraLite(): Promise<{
  aurora_lite_llm: "online" | "fallback";
  model: string;
  profile_version: string;
  profile_loaded: boolean;
  reason?: string;
}> {
  const base = {
    model: AURORA_LITE_MODEL,
    profile_version: auroraLiteProfileVersion,
    profile_loaded: Boolean((profile as any)?.identity?.stage_name),
  };
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { ...base, aurora_lite_llm: "fallback", reason: "LOVABLE_API_KEY not available to this function" };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AURORA_LITE_MODEL,
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
        reasoning_effort: "none",
        max_tokens: 500,
      }),
    });
    if (!res.ok) return { ...base, aurora_lite_llm: "fallback", reason: `gateway_${res.status}` };
    const data = await res.json();
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) return { ...base, aurora_lite_llm: "fallback", reason: "empty_completion" };
    return { ...base, aurora_lite_llm: "online" };
  } catch (err) {
    return { ...base, aurora_lite_llm: "fallback", reason: err instanceof Error ? err.message : "llm_error" };
  }
}
