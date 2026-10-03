// Aurora Lite — compact server-side interview runtime for Cola B.
// NOT ShibaOS/Aurora. It combines one canonical JSON profile with the current
// session context, recent conversation history and active producer injections.
// The same input/output contract is used by full Aurora later, so the client
// never changes when the engine is swapped.

import { configuredBrains, generateWithFallback } from "./brainProviders.ts";
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
  provider: string;
  model: string;
  engine: string;
  mock: boolean;
  metadata: Record<string, unknown>;
}

export const AURORA_LITE_ENGINE = "aurora-lite";
export const auroraLiteProfileVersion = (profile as any)?._meta?.version ?? "unknown";

const isCantonese = (t: string) => /[\u4e00-\u9fff]/.test(t);

export const AURORA_LITE_MODEL = "gpt-5.6-luna";

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
  const turnCount = input.conversation_history.filter((m) => m.role === "cola").length;
  // Only approved, localized fallback lines. Never append raw producer material.
  return pool.length ? pool[turnCount % pool.length] : zh ? "我諗一諗先。" : "Let me think about that for a second.";
}

/** Canonical Aurora context is independent of the selected language engine. */
export async function generateAuroraLite(input: AuroraLiteInput, signal?: AbortSignal): Promise<AuroraLiteOutput> {
  const result = await generateWithFallback(configuredBrains((name) => Deno.env.get(name)), {
    systemPrompt: buildAuroraLitePrompt(input),
    history: input.conversation_history.slice(-12).filter(m => ["cola", "interviewer"].includes(m.role))
      .map(m => ({ role: m.role === "cola" ? "assistant" : "user", content: m.content })),
    userText: input.user_text, signal,
  }, () => fallbackReply(input));
  return { reply_text: result.text, provider: result.provider, model: result.model,
    engine: AURORA_LITE_ENGINE, mock: result.provider === "deterministic",
    metadata: { provider: result.provider, model: result.model, brain_ms: result.latencyMs,
      profile_version: auroraLiteProfileVersion } };
}

/** Staff-only probe uses exactly the same provider selection as real turns. */
export async function probeAuroraLite() {
  const result = await generateWithFallback(configuredBrains((name) => Deno.env.get(name)), {
    systemPrompt: "Reply with the single word ok.", history: [], userText: "Hello",
  }, () => "ok");
  return { aurora_lite_llm: result.provider === "deterministic" ? "fallback" : "online",
    reason: result.provider === "deterministic" ? "providers_unavailable" : undefined,
    provider: result.provider, model: result.model, latency_ms: result.latencyMs,
    profile_version: auroraLiteProfileVersion, profile_loaded: Boolean(profile.identity.stage_name) };
}
