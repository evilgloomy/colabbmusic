import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://colabbmusic.com";

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/music", priority: "0.9", changefreq: "weekly" },
  { path: "/videos", priority: "0.8", changefreq: "weekly" },
  { path: "/store", priority: "0.8", changefreq: "weekly" },
  { path: "/story", priority: "0.8", changefreq: "daily" },
  { path: "/press", priority: "0.7", changefreq: "monthly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/chat", priority: "0.5", changefreq: "monthly" },
  { path: "/policies", priority: "0.3", changefreq: "yearly" },
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    "  </url>",
  ].filter(Boolean).join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [storiesRes, releasesRes] = await Promise.all([
      supabase.from("stories").select("id, posted_at").order("posted_at", { ascending: false }).limit(1000),
      supabase.from("releases").select("id, updated_at, sort_date").order("sort_date", { ascending: false }).limit(1000),
    ]);

    const entries: string[] = [];

    for (const r of STATIC_ROUTES) {
      entries.push(urlEntry(`${SITE_URL}${r.path}`, undefined, r.changefreq, r.priority));
    }

    for (const s of storiesRes.data || []) {
      const lastmod = s.posted_at ? new Date(s.posted_at as string).toISOString().split("T")[0] : undefined;
      entries.push(urlEntry(`${SITE_URL}/story/${s.id}`, lastmod, "monthly", "0.7"));
    }

    for (const r of releasesRes.data || []) {
      const lastmod = (r.updated_at || r.sort_date) ? new Date((r.updated_at || r.sort_date) as string).toISOString().split("T")[0] : undefined;
      entries.push(urlEntry(`${SITE_URL}/release/${r.id}`, lastmod, "monthly", "0.8"));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
      status: 200,
    });
  } catch (e) {
    return new Response(`<?xml version="1.0"?><error>${(e as Error).message}</error>`, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
      status: 500,
    });
  }
});
