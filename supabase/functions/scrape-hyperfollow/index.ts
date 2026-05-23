import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StreamingLink {
  platform: string;
  url: string;
}

function extractLinks(html: string): StreamingLink[] {
  const links: StreamingLink[] = [];

  // Match all anchor tags inside hyperDspLink spans
  const linkRegex =
    /<a[^>]+target="_blank"[^>]+href="([^"]+)"[^>]*>[\s\S]*?<div[^>]*style="flex:\s*1[^"]*"[^>]*>\s*([\w\s]+?)\s*<\/div>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1].replace(/&amp;/g, "&");
    const platform = match[2].trim();

    if (!platform || !url) continue;

    // Clean up Spotify affiliate redirect
    if (url.includes("prf.hn/click")) {
      const destMatch = url.match(/destination:(https?[^\s&]+)/);
      if (destMatch) {
        url = decodeURIComponent(destMatch[1]);
      }
    }

    // Normalize platform names
    const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, "_");

    links.push({ platform: normalizedPlatform, url });
  }

  return links;
}

const ALLOWED_STREAMING_HOSTS = new Set([
  "open.spotify.com", "spotify.com",
  "music.apple.com", "itunes.apple.com",
  "music.youtube.com", "youtube.com", "youtu.be",
  "deezer.com", "www.deezer.com",
  "tidal.com", "listen.tidal.com",
  "music.amazon.com", "amazon.com",
  "soundcloud.com",
  "pandora.com",
  "audiomack.com",
  "music.anghami.com", "anghami.com",
  "boomplay.com",
  "qobuz.com",
]);

function isAllowedStreamingUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.replace(/^www\./, "");
    for (const allowed of ALLOWED_STREAMING_HOSTS) {
      if (host === allowed || host.endsWith("." + allowed)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin-only: require service-role bearer token
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ success: false, error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { hyperfollow_url, release_id } = await req.json();

    if (!hyperfollow_url || !release_id) {
      return new Response(
        JSON.stringify({ success: false, error: "hyperfollow_url and release_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate release_id is a UUID
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof release_id !== "string" || !uuidRe.test(release_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_release_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate hyperfollow_url allowlist
    let parsedHf: URL;
    try { parsedHf = new URL(hyperfollow_url); } catch {
      return new Response(
        JSON.stringify({ success: false, error: "invalid_hyperfollow_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const hfHost = parsedHf.hostname.replace(/^www\./, "");
    const hfPathOk = parsedHf.pathname.startsWith("/hyperfollow/") || parsedHf.pathname.startsWith("/ds/");
    if (parsedHf.protocol !== "https:" || hfHost !== "distrokid.com" || !hfPathOk) {
      return new Response(
        JSON.stringify({ success: false, error: "hyperfollow_url must be a https://distrokid.com/hyperfollow/ URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify release_id exists
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: relRow, error: relErr } = await supabase
      .from("releases").select("id").eq("id", release_id).maybeSingle();
    if (relErr || !relRow) {
      return new Response(
        JSON.stringify({ success: false, error: "release_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Firecrawl to render JS-heavy DistroKid pages
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: parsedHf.toString(),
        formats: ['html'],
        waitFor: 5000,
      }),
    });

    if (!fcRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl scrape failed: ${fcRes.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcData = await fcRes.json();
    const html = fcData?.data?.html || fcData?.html || '';
    const allLinks = extractLinks(html);
    // Filter to known streaming hosts only — prevents phishing/malware injection
    const links = allLinks.filter((l) => isAllowedStreamingUrl(l.url));

    if (links.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No valid streaming links found on page" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert streaming links
    const { error: upsertError } = await supabase
      .from("streaming_links")
      .upsert(
        links.map((l) => ({
          release_id,
          platform: l.platform,
          url: l.url,
        })),
        { onConflict: "release_id,platform" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(
        JSON.stringify({ success: false, error: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, links }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
