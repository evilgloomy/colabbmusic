import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEFAULT_API_URL = "https://api.liveavatar.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Mint a short-lived HeyGen LiveAvatar LITE session token.
 * The long-lived provider API key and Cola avatar id never leave the server.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ ok: false, error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) return json({ ok: false, error: "server_not_configured" }, 500);

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ ok: false, error: "unauthorized" }, 401);

    // Only users explicitly admitted to the private Live area may mint a token.
    const { data: roles } = await admin.from("live_user_roles").select("role").eq("user_id", user.id);
    if (!roles?.length) return json({ ok: false, error: "forbidden" }, 403);

    const apiKey = Deno.env.get("LIVEAVATAR_API_KEY");
    const avatarId = Deno.env.get("LIVEAVATAR_AVATAR_ID");
    if (!apiKey || !avatarId) {
      return json({ ok: false, configured: false, error: "not_configured" }, 503);
    }

    const apiUrl = (Deno.env.get("LIVEAVATAR_API_URL") ?? DEFAULT_API_URL).replace(/\/$/, "");
    const sandboxValue = (Deno.env.get("LIVEAVATAR_SANDBOX") ?? "false").toLowerCase();
    const isSandbox = sandboxValue === "true" || sandboxValue === "1";

    const upstream = await fetch(`${apiUrl}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "LITE",
        avatar_id: avatarId,
        is_sandbox: isSandbox,
        video_settings: {
          quality: "high",
          encoding: "H264",
        },
      }),
    });

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const providerMessage =
        payload?.data?.[0]?.message || payload?.message || payload?.error || `provider_http_${upstream.status}`;
      console.error("LiveAvatar token request failed", upstream.status, providerMessage);
      return json({ ok: false, configured: true, error: "liveavatar_provider_error" }, 502);
    }

    const data = payload?.data ?? payload;
    const sessionToken = data?.session_token;
    const sessionId = data?.session_id;
    if (!sessionToken) {
      console.error("LiveAvatar token response missing session_token");
      return json({ ok: false, configured: true, error: "liveavatar_invalid_response" }, 502);
    }

    return json({
      ok: true,
      configured: true,
      session_token: sessionToken,
      session_id: sessionId ?? null,
      provider: "liveavatar-lite",
    });
  } catch (err) {
    console.error("liveavatar-session error", err instanceof Error ? err.message : "unknown");
    return json({ ok: false, error: "liveavatar_session_error" }, 500);
  }
});
