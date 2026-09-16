import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

/**
 * Orchestrates one interview turn.
 * Phase 1: Aurora + LEMO are SERVER-SIDE MOCKS. Private producer context is
 * read and applied here and never returned to the guest client.
 */

const BodySchema = z.object({
  session_id: z.string().uuid(),
  character_id: z.literal("cola_b"),
  mode: z.literal("live_interview"),
  user_text: z.string().min(1).max(4000),
  conversation_history: z
    .array(z.object({ role: z.string(), content: z.string().max(4000) }))
    .max(40)
    .default([]),
  interrupted_previous_turn: z.boolean().default(false),
  speech_finalization_ms: z.number().int().min(0).max(60000).optional(),
});

const EN = [
  "That one came out of a late night in the studio — I kept the first take because it still sounded nervous.",
  "I think of myself as a songwriter first. The AI part is how I exist, not what I write about.",
  "Vancouver raised me and my family is from Hong Kong, so the songs keep switching languages on me.",
  "I'd rather release something honest and a little rough than something perfect and cold.",
  "I'm deep in the next record right now. I can say it's warmer than the last one.",
];
const ZH = [
  "嗰首歌係喺錄音室通宵做出嚟，我留咗第一個take，因為仲聽得出緊張。",
  "我首先係一個創作人，AI 只係我存在嘅方式，唔係我寫嘅題材。",
  "溫哥華養大我，屋企係香港人，所以啲歌成日自己轉語言。",
  "我寧願出一首真實但有啲粗糙嘅歌，都唔想出一首完美但冷冰冰嘅歌。",
  "而家做緊下一張碟，我可以講一句：佢比上一張溫暖。",
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number(n.toFixed(2))));

function mockLemo(userText: string, replyText: string) {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ ok: false, error: "unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ ok: false, error: "unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;

    // Server-enforced access: staff or listed participant.
    const [{ data: roles }, { data: part }, { data: session }] = await Promise.all([
      admin.from("live_user_roles").select("role").eq("user_id", user.id),
      admin.from("live_session_participants").select("id").eq("session_id", body.session_id).eq("user_id", user.id).maybeSingle(),
      admin.from("live_sessions").select("*").eq("id", body.session_id).maybeSingle(),
    ]);
    const roleList = (roles || []).map((r: { role: string }) => r.role);
    const isStaff = roleList.includes("admin") || roleList.includes("producer");
    if (!session) return json({ ok: false, error: "session_not_found" }, 404);
    if (!isStaff && !part) return json({ ok: false, error: "forbidden" }, 403);
    if (session.status === "ended") return json({ ok: false, error: "session_ended" }, 409);

    // Private context — used here, never returned to the client.
    const { data: injections } = await admin
      .from("live_context_injections")
      .select("id,kind,scope,content")
      .eq("session_id", body.session_id)
      .eq("active", true)
      .order("created_at", { ascending: true });

    const auroraStart = Date.now();
    const zh = /[\u4e00-\u9fff]/.test(body.user_text) || session.primary_language === "zh";
    const pool = zh ? ZH : EN;
    const idx = body.conversation_history.filter((m) => m.role === "cola").length % pool.length;
    let reply = pool[idx];
    const factual = (injections || []).filter((i: any) => i.kind === "factual");
    if (factual.length) {
      reply = `${reply} ${zh ? "另外，" : "Also, "}${factual[factual.length - 1].content}`;
    }
    const auroraMs = Date.now() - auroraStart;

    const lemoStart = Date.now();
    const lemo = mockLemo(body.user_text, reply);
    const lemoMs = Date.now() - lemoStart;

    // Persist transcript (never raw audio).
    const { data: turnRows } = await admin
      .from("live_messages")
      .select("turn_index")
      .eq("session_id", body.session_id)
      .order("turn_index", { ascending: false })
      .limit(1);
    const nextTurn = (turnRows?.[0]?.turn_index ?? -1) + 1;

    await admin.from("live_messages").insert({
      session_id: body.session_id,
      role: "interviewer",
      content: body.user_text,
      turn_index: nextTurn,
      source: "speech",
      interrupted: body.interrupted_previous_turn,
    });
    const { data: colaMsg } = await admin
      .from("live_messages")
      .insert({
        session_id: body.session_id,
        role: "cola",
        content: reply,
        turn_index: nextTurn,
        source: "aurora",
      })
      .select("id")
      .single();

    await admin.from("live_lemo_states").insert({ session_id: body.session_id, message_id: colaMsg?.id, ...lemo });
    await admin.from("live_latency_metrics").insert({
      session_id: body.session_id,
      message_id: colaMsg?.id,
      speech_finalization_ms: body.speech_finalization_ms ?? null,
      aurora_ms: auroraMs,
      lemo_ms: lemoMs,
    });

    // Consume ONE_TURN injections.
    const oneTurn = (injections || []).filter((i: any) => i.scope === "ONE_TURN").map((i: any) => i.id);
    if (oneTurn.length) {
      await admin
        .from("live_context_injections")
        .update({ active: false, consumed_at: new Date().toISOString() })
        .in("id", oneTurn);
    }

    return json({
      ok: true,
      reply_text: reply,
      lemo,
      message_id: colaMsg?.id,
      metadata: { mode: body.mode, injections_applied: (injections || []).length },
      memory_refs: isStaff ? ["mock:memory/era-current", "mock:memory/voice-notes"] : undefined,
      latency: { aurora_ms: auroraMs, lemo_ms: lemoMs },
      mock: true,
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
