import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { probeAuroraLite } from "../_shared/auroraLite.ts";

/** Staff-only service status probe: real Aurora Lite / provider health. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: userData } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  const user = userData?.user;
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: roles } = await admin.from("live_user_roles").select("role").eq("user_id", user.id);
  const roleList = (roles || []).map((r: { role: string }) => r.role);
  if (!roleList.includes("admin") && !roleList.includes("producer")) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aurora = await probeAuroraLite();
  const apiKeyPresent = Boolean(Deno.env.get("MINIMAX_API_KEY"));
  const voiceIdPresent = Boolean(Deno.env.get("MINIMAX_VOICE_ID"));
  const liveAvatarApiKeyPresent = Boolean(Deno.env.get("LIVEAVATAR_API_KEY"));
  const liveAvatarIdPresent = Boolean(Deno.env.get("LIVEAVATAR_AVATAR_ID"));
  const liveAvatarConfigured = liveAvatarApiKeyPresent && liveAvatarIdPresent;

  // Reachability probe: short TTS call, no audio retained.
  let ttsReachable = false;
  let voiceReason: string | undefined;
  if (apiKeyPresent && voiceIdPresent) {
    try {
      const host = (Deno.env.get("MINIMAX_API_HOST") ?? "https://api.minimax.io").replace(/\/$/, "");
      const res = await fetch(`${host}/v1/t2a_v2`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("MINIMAX_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get("MINIMAX_MODEL") ?? "speech-2.8-turbo",
          text: "Hi.",
          stream: false,
          output_format: "hex",
          voice_setting: { voice_id: Deno.env.get("MINIMAX_VOICE_ID"), speed: 1, vol: 1, pitch: 0 },
          audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
        }),
      });
      const body = await res.json();
      ttsReachable = res.ok && !body?.base_resp?.status_code && Boolean(body?.data?.audio);
      if (!ttsReachable) voiceReason = `provider_status_${body?.base_resp?.status_code ?? res.status}`;
    } catch (err) {
      voiceReason = err instanceof Error ? err.message : "probe_failed";
    }
  } else {
    voiceReason = "secrets_missing";
  }

  return new Response(
    JSON.stringify({
      ok: true,
      mock_mode: aurora.aurora_lite_llm !== "online",
      aurora_lite: aurora,
      services: {
        speech: { health: "live", provider: "Browser SpeechRecognition (typed fallback)" },
        aurora: {
          health: aurora.aurora_lite_llm === "online" ? "online" : "fallback",
          provider: "Aurora Lite",
          model: aurora.model,
          profile_version: aurora.profile_version,
          reason: aurora.reason,
        },
        lemo: { health: "online", provider: "LEMO Lite (heuristic)" },
        voice: {
          health: ttsReachable ? "online" : apiKeyPresent ? "error" : "fallback",
          provider: "MiniMax Speech 2.8 Turbo — Cola B",
          minimax_api_key_present: apiKeyPresent,
          minimax_voice_id_present: voiceIdPresent,
          minimax_tts_reachable: ttsReachable,
          reason: voiceReason,
          fallback: "Browser TTS (emergency fallback only)",
        },
        avatar: {
          health: liveAvatarConfigured ? "configured" : "fallback",
          provider: "LiveAvatar LITE — Cola B",
          liveavatar_api_key_present: liveAvatarApiKeyPresent,
          liveavatar_avatar_id_present: liveAvatarIdPresent,
          fallback: "Editorial Portrait Placeholder",
          reason: liveAvatarConfigured ? undefined : "liveavatar_secrets_missing",
        },
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
