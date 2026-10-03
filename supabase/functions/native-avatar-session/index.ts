import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { SignJWT } from "npm:jose@5";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await admin.auth.getUser(token);
    if (!data.user) return json({ error: "unauthorized" }, 401);
    const body = await req.json();
    if (typeof body.session_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.session_id)) return json({ error: "invalid_session" }, 400);
    const [{ data: roles, error: roleError }, { data: participant, error: participantError }, { data: session, error: sessionError }] = await Promise.all([
      admin.from("live_user_roles").select("role").eq("user_id", data.user.id),
      admin.from("live_session_participants").select("id").eq("session_id", body.session_id).eq("user_id", data.user.id).maybeSingle(),
      admin.from("live_sessions").select("id,status").eq("id", body.session_id).maybeSingle(),
    ]);
    if (roleError || participantError || sessionError) return json({ error: "access_unavailable" }, 503);
    if (!session || session.status === "ended") return json({ error: "SessionExpired" }, 409);
    if (!roles?.some(r => ["admin", "producer"].includes(r.role)) && !participant) return json({ error: "forbidden" }, 403);
    const secret = Deno.env.get("AVATAR_JWT_SECRET");
    const worker = Deno.env.get("AVATAR_ENGINE_URL")?.replace(/\/$/, "");
    if (!secret || secret.length < 32 || !worker || !worker.startsWith("https://")) return json({ error: "AvatarUnavailable" }, 503);
    const sessionId = crypto.randomUUID();
    const jwt = await new SignJWT({ session_id: sessionId, live_session_id: session.id, avatar_id: "cola_b" })
      .setProtectedHeader({ alg: "HS256" }).setSubject(data.user.id).setIssuer("shiba-live")
      .setAudience("shiba-avatar").setJti(sessionId).setIssuedAt().setExpirationTime("15m")
      .sign(new TextEncoder().encode(secret));
    const ice: Record<string, unknown>[] = [];
    if (Deno.env.get("AVATAR_STUN_URL")) ice.push({ urls: Deno.env.get("AVATAR_STUN_URL") });
    // Short-lived coturn REST credentials. Never expose the TURN shared secret.
    const turnSecret = Deno.env.get("AVATAR_TURN_SECRET");
    if (Deno.env.get("AVATAR_TURN_URL") && turnSecret) {
      const username = `${Math.floor(Date.now() / 1000) + 900}:${sessionId}`;
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(turnSecret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
      const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(username)));
      ice.push({ urls: Deno.env.get("AVATAR_TURN_URL"), username, credential: btoa(String.fromCharCode(...signature)) });
    }
    return json({ ok: true, session_id: sessionId, worker_url: worker, token: jwt, ice_servers: ice });
  } catch { return json({ error: "AvatarUnavailable" }, 500); }
});
