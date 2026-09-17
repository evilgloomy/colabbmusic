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
  const minimaxConfigured = Boolean(Deno.env.get("MINIMAX_API_KEY"));

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
          health: minimaxConfigured ? "online" : "placeholder",
          provider: minimaxConfigured ? "Cola Voice (MiniMax speech-02-hd)" : "Browser TTS Placeholder",
          voice_id: Deno.env.get("MINIMAX_VOICE_ID") ?? "moss_audio_baae1c62-…(default)",
          fallback: "Browser TTS Placeholder",
        },
        avatar: { health: "placeholder", provider: "Editorial Portrait Placeholder (no lip sync)" },
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
