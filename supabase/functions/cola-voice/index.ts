import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

/**
 * Cola Voice server proxy — MiniMax T2A v2 (speech-2.8-turbo).
 *
 * The browser never receives MINIMAX_API_KEY or MINIMAX_VOICE_ID. Two modes:
 *   stream=true  -> SSE of base64 MP3 chunks (low time-to-first-audio)
 *   stream=false -> single JSON payload with base64 MP3
 *
 * Secrets: MINIMAX_API_KEY (required), MINIMAX_VOICE_ID, MINIMAX_MODEL,
 *          MINIMAX_API_HOST (optional overrides).
 */

const DEFAULT_MODEL = "speech-2.8-turbo";
const DEFAULT_HOST = "https://api.minimax.io";

const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  language: z.string().max(20).optional(),
  speaking_rate: z.number().min(0.5).max(2).optional(),
  stream: z.boolean().default(true),
  format: z.enum(["mp3", "pcm"]).default("mp3"),
  lemo: z
    .object({
      emotion: z.string().max(40).optional(),
      warmth: z.number().optional(),
      energy: z.number().optional(),
      speaking_rate: z.number().optional(),
      pause_before_ms: z.number().optional(),
      delivery_note: z.string().max(400).optional(),
    })
    .optional(),
});

function languageBoost(language?: string): string {
  const l = (language ?? "").toLowerCase();
  if (!l) return "auto";
  if (l.startsWith("yue") || l.includes("hk") || l.startsWith("zh") || l.includes("canton")) return "Chinese,Yue";
  if (l.startsWith("en")) return "English";
  return "auto";
}

function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) binary += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(binary);
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
    const voiceId = Deno.env.get("MINIMAX_VOICE_ID");
    if (!apiKey || !voiceId) {
      return json(
        {
          ok: false,
          error: "voice_not_configured",
          minimax_api_key_present: Boolean(apiKey),
          minimax_voice_id_present: Boolean(voiceId),
        },
        503,
      );
    }

    const host = (Deno.env.get("MINIMAX_API_HOST") ?? DEFAULT_HOST).replace(/\/$/, "");
    const model = Deno.env.get("MINIMAX_MODEL") ?? DEFAULT_MODEL;
    const rawRate = body.speaking_rate ?? body.lemo?.speaking_rate ?? 1;
    const speed = Math.max(0.85, Math.min(1.15, Number.isFinite(rawRate) ? rawRate : 1));

    const payload: Record<string, unknown> = {
      model,
      text: body.text,
      stream: body.stream,
      language_boost: languageBoost(body.language),
      voice_setting: { voice_id: voiceId, speed, vol: 1, pitch: 0,
        emotion: ["playful", "bright"].includes(body.lemo?.emotion ?? "") ? "happy" : "calm" },
      audio_setting: { sample_rate: body.format === "pcm" ? 16000 : 32000, bitrate: 128000, format: body.format, channel: 1 },
    };
    if (!body.stream) payload.output_format = "hex";

    const aborter = new AbortController();
    req.signal.addEventListener("abort", () => aborter.abort(), { once: true });
    const started = Date.now();
    const upstream = await fetch(`${host}/v1/t2a_v2`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: aborter.signal,
    });

    if (!upstream.ok || !upstream.body) {
      console.error("minimax http error", upstream.status);
      return json({ ok: false, error: "voice_provider_error", status: upstream.status }, 502);
    }

    if (!body.stream) {
      const data = await upstream.json();
      const status = data?.base_resp?.status_code;
      const hex: string | undefined = data?.data?.audio;
      if (status && status !== 0) {
        console.error("minimax api error", status, data?.base_resp?.status_msg);
        return json({ ok: false, error: "voice_provider_error", provider_status: status }, 502);
      }
      if (!hex) return json({ ok: false, error: "voice_empty_audio" }, 502);
      return json({
        ok: true,
        provider: "minimax",
        model,
        format: body.format,
        latency_ms: Date.now() - started,
        audio_base64: hexToBase64(hex),
      });
    }

    // Streaming: forward MiniMax's incremental hex chunks as base64 SSE events.
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      cancel() { aborter.abort(); },
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        const reader = upstream.body!.getReader();
        let buffer = "";
        let firstAt = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buffer.indexOf("\n")) >= 0) {
              const line = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 1);
              if (!line.startsWith("data:")) continue;
              let evt: any;
              try {
                evt = JSON.parse(line.slice(5));
              } catch {
                continue;
              }
              const status = evt?.base_resp?.status_code;
              if (status && status !== 0) {
                send({ type: "error", error: "voice_provider_error", provider_status: status });
                return;
              }
              // status 2 repeats the full audio with extra_info — skip it.
              if (evt?.extra_info || evt?.data?.status === 2) continue;
              const hex: string | undefined = evt?.data?.audio;
              if (!hex) continue;
              if (!firstAt) {
                firstAt = Date.now();
                send({ type: "meta", provider: "minimax", model, ttfa_ms: firstAt - started });
              }
              send({ type: "chunk", audio_base64: hexToBase64(hex) });
            }
          }
          send({ type: "done", total_ms: Date.now() - started });
        } catch (err) {
          console.error("minimax stream error", err);
          try { send({ type: "error", error: "voice_stream_error" }); } catch { /* downstream cancelled */ }
        } finally {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
          try { controller.close(); } catch { /* downstream cancelled */ }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    console.error("cola-voice error", err);
    return json({ ok: false, error: "SpeechUnavailable" }, 500);
  }
});
