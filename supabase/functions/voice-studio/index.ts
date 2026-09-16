import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

/**
 * VoiceStudio server proxy — STUB.
 *
 * This endpoint owns Cola's real voice credentials so they never reach the
 * browser. The provider request/response mapping is intentionally left blank
 * until the actual VoiceStudio API specification is supplied; the normalized
 * contract below is already final and the client adapter codes against it.
 *
 * Required secrets (add in Project Settings -> Secrets):
 *   VOICESTUDIO_API_URL, VOICESTUDIO_API_KEY, VOICESTUDIO_VOICE_ID
 */

const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  voice_id: z.string().max(200).optional(),
  language: z.string().max(20).optional(),
  speaking_rate: z.number().min(0.3).max(2).optional(),
  stream: z.boolean().default(true),
  lemo: z
    .object({
      emotion: z.string().max(40).optional(),
      valence: z.number().optional(),
      arousal: z.number().optional(),
      warmth: z.number().optional(),
      confidence: z.number().optional(),
      energy: z.number().optional(),
      speaking_rate: z.number().optional(),
      pause_before_ms: z.number().optional(),
      delivery_note: z.string().max(400).optional(),
    })
    .optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ ok: false, error: "unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) return json({ ok: false, error: "unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400);

    const apiUrl = Deno.env.get("VOICESTUDIO_API_URL");
    const apiKey = Deno.env.get("VOICESTUDIO_API_KEY");
    const voiceId = parsed.data.voice_id || Deno.env.get("VOICESTUDIO_VOICE_ID");

    if (!apiUrl || !apiKey || !voiceId) {
      // Not configured yet: the client falls back to the browser TTS placeholder.
      return json({ ok: false, error: "voicestudio_not_configured", configured: false }, 503);
    }

    // TODO: map the normalized request to the real VoiceStudio payload once the
    // provider specification is available, and stream the audio response back:
    //
    // const upstream = await fetch(apiUrl, { method: "POST", headers: {...}, body: ... });
    // return new Response(upstream.body, { headers: { ...corsHeaders, "Content-Type": "audio/mpeg" } });
    return json({ ok: false, error: "voicestudio_mapping_pending", configured: true }, 501);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : "error" }, 500);
  }
});
