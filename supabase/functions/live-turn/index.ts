import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { generateAuroraLite, AURORA_LITE_ENGINE, auroraLiteProfileVersion } from "../_shared/auroraLite.ts";
import { analyzeLemo } from "../_shared/lemoLite.ts";

/**
 * Orchestrates one interview turn: Speech -> Aurora Lite -> LEMO -> (client) Cola Voice.
 * Private producer context and the canonical profile are read here and never
 * returned to guest clients.
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
    const aurora = await generateAuroraLite({
      session,
      user_text: body.user_text,
      conversation_history: body.conversation_history,
      injections: (injections || []) as any,
      interrupted_previous_turn: body.interrupted_previous_turn,
    });
    const reply = aurora.reply_text;
    const auroraMs = Date.now() - auroraStart;

    const lemoStart = Date.now();
    const lemo = analyzeLemo(body.user_text, reply);
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
        source: AURORA_LITE_ENGINE,
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
      engine: aurora.engine,
      // Diagnostics with any internal detail are staff-only.
      metadata: isStaff
        ? { mode: body.mode, engine: aurora.engine, profile_version: auroraLiteProfileVersion, injections_applied: (injections || []).length, ...aurora.metadata }
        : { mode: body.mode },
      memory_refs: isStaff ? [`aurora-lite:profile@${auroraLiteProfileVersion}`] : undefined,
      latency: { aurora_ms: auroraMs, lemo_ms: lemoMs },
      mock: aurora.mock,
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
