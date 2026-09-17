import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

/**
 * Cola Voice server proxy — MiniMax T2A v2.
 *
 * The browser never holds credentials: MINIMAX_API_KEY stays server-side.
 * Normalized contract in / normalized audio out, so the provider can be
 * swapped without touching the client adapter.
 *
 * Secrets: MINIMAX_API_KEY (required), MINIMAX_VOICE_ID, MINIMAX_MODEL,
 *          MINIMAX_API_HOST (optional overrides).
 */

const DEFAULT_VOICE_ID = "moss_audio_baae1c62-e8f1-11ef-98b1-0a984ed190a1";
const DEFAULT_MODEL = "speech-02-hd";
const DEFAULT_HOST = "https://api.minimax.io";

const MINIMAX_EMOTIONS = ["happy", "sad", "angry", "fearful", "disgusted", "surprised", "neutral"] as const;

const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  voice_id: z.string().max(200).optional(),
  language: z.string().max(20).optional(),
  speaking_rate: z.number().min(0.5).max(2).optional(),
  stream: z.boolean().default(false),
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

function mapEmotion(raw?: string): string {
  const e = (raw ?? "").toLowerCase();
  if (MINIMAX_EMOTIONS.includes(e as (typeof MINIMAX_EMOTIONS)[number])) return e;
  if (/joy|excite|warm|playful|bright|amused/.test(e)) return "happy";
  if (/sad|melanchol|wistful|tender|somber/.test(e)) return "sad";
  if (/anger|frustrat|firm/.test(e)) return "angry";
  if (/surpris|awe|curious/.test(e)) return "surprised";
  if (/anxious|nervous|fear/.test(e)) return "fearful";
  return "neutral";
}

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
    const body = parsed.data;

    const apiKey = Deno.env.get("MINIMAX_API_KEY");
    if (!apiKey) return json({ ok: false, error: "voice_not_configured", configured: false }, 503);

    const host = (Deno.env.get("MINIMAX_API_HOST") ?? DEFAULT_HOST).replace(/\/$/, "");
    const model = Deno.env.get("MINIMAX_MODEL") ?? DEFAULT_MODEL;
    const voiceId = body.voice_id || Deno.env.get("MINIMAX_VOICE_ID") || DEFAULT_VOICE_ID;
    const rate = Math.max(0.5, Math.min(2, body.speaking_rate ?? body.lemo?.speaking_rate ?? 1));

    const started = Date.now();
    const upstream = await fetch(`${host}/v1/t2a_v2`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        text: body.text,
        stream: false,
        language_boost: body.language === "zh" ? "Chinese,Yue" : "auto",
        voice_setting: {
          voice_id: voiceId,
          speed: rate,
          vol: 1,
          pitch: 0,
          emotion: mapEmotion(body.lemo?.emotion),
        },
        audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("minimax http error", upstream.status, detail.slice(0, 300));
      return json({ ok: false, error: "voice_provider_error", status: upstream.status }, 502);
    }

    const payload = await upstream.json();
    const statusCode = payload?.base_resp?.status_code;
    const hex: string | undefined = payload?.data?.audio;
    if (statusCode && statusCode !== 0) {
      console.error("minimax api error", statusCode, payload?.base_resp?.status_msg);
      return json({ ok: false, error: "voice_provider_error", provider_status: statusCode }, 502);
    }
    if (!hex) return json({ ok: false, error: "voice_empty_audio" }, 502);

    // hex -> bytes -> base64 (client decodes to an AudioBuffer)
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }

    return json({
      ok: true,
      provider: "minimax",
      model,
      voice_id: voiceId,
      format: "mp3",
      latency_ms: Date.now() - started,
      audio_base64: btoa(binary),
    });
  } catch (err) {
    console.error("cola-voice error", err);
    return json({ ok: false, error: err instanceof Error ? err.message : "error" }, 500);
  }
});
