import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/** Staff-only service status probe. Phase 1 reports mock adapters. */
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

  return new Response(
    JSON.stringify({
      ok: true,
      mock_mode: true,
      services: {
        speech: { health: "mock", provider: "browser/simulated" },
        aurora: { health: "mock", provider: "server-mock" },
        lemo: { health: "mock", provider: "server-mock" },
        voice: { health: "mock", provider: "browser-tts-placeholder" },
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
