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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hyperfollow_url, release_id } = await req.json();

    if (!hyperfollow_url || !release_id) {
      return new Response(
        JSON.stringify({ success: false, error: "hyperfollow_url and release_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the HyperFollow page
    const res = await fetch(hyperfollow_url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch HyperFollow page: ${res.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await res.text();
    const links = extractLinks(html);

    if (links.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No streaming links found on page" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store links in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
