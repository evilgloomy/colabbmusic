/** Authenticate producer controls without altering the existing RLS/auth schema. */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { SignJWT, jwtVerify } from "npm:jose@5";
import { z } from "npm:zod@3";
const eventSchema = z.object({ action: z.enum(["stop_cola", "cancel_response", "force_listening", "mute", "resume", "replay_last", "clear_context", "end_session", "speak_exact", "manual_response"]),
  payload: z.object({ text: z.string().max(4000).optional(), muted: z.boolean().optional() }).optional() });
const schema = z.object({ session_id: z.string().uuid(), mode: z.enum(["issue", "verify"]), event: eventSchema.optional(), ticket: z.string().max(12000).optional() });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false }, 405);
  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    const { data } = await admin.auth.getUser((req.headers.get("Authorization") ?? "").replace(/^Bearer /, ""));
    if (!data.user) return json({ ok: false }, 401);
    const body = schema.parse(await req.json());
    const [{ data: roles }, { data: part }, { data: session }] = await Promise.all([
      admin.from("live_user_roles").select("role").eq("user_id", data.user.id),
      admin.from("live_session_participants").select("id").eq("session_id", body.session_id).eq("user_id", data.user.id).maybeSingle(),
      admin.from("live_sessions").select("id").eq("id", body.session_id).maybeSingle(),
    ]);
    const staff = roles?.some(r => ["admin", "producer"].includes(r.role));
    if (!session || (!staff && !part)) return json({ ok: false }, 403);
    // Domain-separated signing key; service-role value itself never leaves backend.
    const key = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`shiba-producer-control:${serviceKey}`)));
    if (body.mode === "issue") {
      if (!staff || !body.event) return json({ ok: false }, 403);
      const ticket = await new SignJWT({ session_id: body.session_id, event: body.event }).setProtectedHeader({ alg: "HS256" })
        .setIssuer("shiba-producer").setAudience("shiba-live-control").setJti(crypto.randomUUID()).setIssuedAt().setExpirationTime("15s").sign(key);
      return json({ ok: true, ticket });
    }
    const { payload } = await jwtVerify(body.ticket ?? "", key, { algorithms: ["HS256"], issuer: "shiba-producer", audience: "shiba-live-control" });
    if (payload.session_id !== body.session_id) return json({ ok: false }, 403);
    return json({ ok: true, id: payload.jti, event: eventSchema.parse(payload.event) });
  } catch { return json({ ok: false }, 400); }
});
