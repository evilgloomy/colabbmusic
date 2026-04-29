// Newsletter subscribe endpoint — public, no JWT required.
// Validates email, inserts into `subscribers` (handling duplicates gracefully),
// and optionally forwards to Mailchimp when MAILCHIMP_API_KEY + MAILCHIMP_LIST_ID
// secrets are configured.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().trim().max(64).optional(),
  locale: z.string().trim().max(16).optional(),
});

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function forwardToMailchimp(email: string): Promise<void> {
  const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
  const listId = Deno.env.get("MAILCHIMP_LIST_ID");
  if (!apiKey || !listId) return;

  const dc = apiKey.split("-")[1];
  if (!dc) {
    console.warn("[subscribe] mailchimp api key missing datacenter suffix");
    return;
  }
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
      },
      body: JSON.stringify({ email_address: email, status: "subscribed" }),
    });
    if (!res.ok && res.status !== 400) {
      console.warn("[subscribe] mailchimp non-2xx", res.status, await res.text());
    }
  } catch (e) {
    console.warn("[subscribe] mailchimp forwarding failed", (e as Error).message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "invalid_input", details: parsed.error.flatten().fieldErrors }, 400);
  }
  const { email, source, locale } = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Soft per-IP heuristic (not a strict rate limiter).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const ipHash = await sha256Hex(ip);

  const sinceIso = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", sinceIso);
  if ((recentCount ?? 0) > 5) {
    return jsonResponse({ error: "too_many_requests" }, 429);
  }

  const { error } = await supabase.from("subscribers").insert({
    email,
    source: source || "unknown",
    locale: locale || null,
    ip_hash: ipHash,
  });

  if (error) {
    // 23505 = unique violation (email already subscribed)
    if ((error as { code?: string }).code === "23505") {
      return jsonResponse({ ok: true, alreadySubscribed: true });
    }
    console.error("[subscribe] insert error", error);
    return jsonResponse({ error: "insert_failed" }, 500);
  }

  // Fire-and-forget ESP forwarding
  forwardToMailchimp(email).catch((e) => console.warn("[subscribe] mailchimp", e));

  return jsonResponse({ ok: true, alreadySubscribed: false });
});
