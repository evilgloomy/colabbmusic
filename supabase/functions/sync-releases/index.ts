const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ── YouTube scraping ───────────────────────────────────────────

async function fetchReleasesPage(handle: string): Promise<any[]> {
  const url = `https://youtube.com/@${handle}/releases`;
  console.log(`Fetching releases page: ${url}`);

  const res = await fetch(url, { headers: YT_HEADERS });
  if (!res.ok) throw new Error(`HTTP error ${res.status} at ${url}`);

  const text = await res.text();
  const jsonMatch = text.match(/var ytInitialData = ({.*?});/);
  if (!jsonMatch) throw new Error('No ytInitialData found');

  const data = JSON.parse(jsonMatch[1]);

  const contents =
    data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[1]?.tabRenderer?.content?.sectionListRenderer?.contents;

  if (!contents) {
    console.warn('No releases found in ytInitialData');
    return [];
  }

  const videos = contents.flatMap((c: any) => {
    const playlist = c?.musicShelfRenderer?.contents?.[0]?.musicResponsiveListItemRenderer;
    if (playlist) {
      return {
        title: playlist?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text,
        artist: playlist?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text,
        videoId: playlist?.playlistId,
      };
    }
    return [];
  });

  console.log(`Found ${videos.length} releases`);
  return videos;
}

async function resolveChannelId(handle: string): Promise<string | null> {
  const url = `https://www.youtube.com/@${handle}`;
  console.log(`Resolving channel ID from: ${url}`);

  const res = await fetch(url, { headers: YT_HEADERS, redirect: 'manual' });

  // Check for a redirect to a /channel/ page
  if (res.status === 302) {
    const redirectUrl = res.headers.get('location');
    const channelIdMatch = redirectUrl?.match(/\/channel\/([A-Za-z0-9_-]+)$/);
    if (channelIdMatch) {
      const channelId = channelIdMatch[1];
      console.log(`Resolved channel ID: ${channelId}`);
      return channelId;
    }
  }

  console.warn('Could not resolve channel ID (no redirect)');
  return null;
}

async function fetchRssDescriptions(channelId: string): Promise<Map<string, string>> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  console.log(`Fetching RSS feed: ${url}`);

  const res = await fetch(url, { headers: YT_HEADERS });
  if (!res.ok) throw new Error(`HTTP error ${res.status} at ${url}`);

  const xml = await res.text();
  const videoIdRegex = /<yt:videoId>(.*?)<\/yt:videoId>/g;
  const descriptionRegex = /<media:description>(.*?)<\/media:description>/g;

  const videoMap = new Map<string, string>();
  let videoIdMatch, descriptionMatch;

  while ((videoIdMatch = videoIdRegex.exec(xml)) !== null && (descriptionMatch = descriptionRegex.exec(xml)) !== null) {
    const videoId = videoIdMatch[1];
    const description = descriptionMatch[1];
    videoMap.set(videoId, description);
  }

  console.log(`Found ${videoMap.size} video descriptions in RSS feed`);
  return videoMap;
}

// ── Enrichment + DB upsert ──────────────────────────────────────

async function enrichRelease(release: any, rssMap: Map<string, string>): Promise<any> {
  const description = rssMap.get(release.videoId);
  const thumbnail_url = `https://i.ytimg.com/vi/${release.videoId}/maxresdefault.jpg`;

  const enriched = {
    ...release,
    description: description || null,
    thumbnail_url: thumbnail_url || null,
    year: null,
  };

  // Extract year from title (e.g. "TITLE (2021)")
  const yearMatch = release.title?.match(/\((\d{4})\)$/);
  if (yearMatch) enriched.year = parseInt(yearMatch[1]);

  return enriched;
}

async function upsertReleases(releases: any[]): Promise<{ inserted: number; updated: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const payload = releases.map((r: any) => ({
    video_id: r.videoId,
    title: r.title,
    artist: r.artist,
    description: r.description,
    thumbnail_url: r.thumbnail_url,
    year: r.year,
  }));

  const res = await fetch(`${supabaseUrl}/rest/v1/releases`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('Upsert error:', res.status, await res.text());
    throw new Error(`HTTP error ${res.status} at upsert`);
  }

  const data = await res.json();
  const inserted = data.filter((r: any) => r.created_at === r.updated_at).length;
  const updated = data.length - inserted;

  console.log(`Upserted ${releases.length} releases: ${inserted} inserted, ${updated} updated`);
  return { inserted, updated };
}

// ── Utils ───────────────────────────────────────────────────────

async function processInBatches<T, U>(items: T[], batchSize: number, delay: number, fn: (item: T) => Promise<U>): Promise<U[]> {
  const results: U[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(item => fn(item));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return results;
}

// ── HyperFollow per-release scraping ──

function extractStreamingLinks(html: string): { platform: string; url: string }[] {
  const links: { platform: string; url: string }[] = [];
  const linkRegex =
    /<a[^>]+target="_blank"[^>]+href="([^"]+)"[^>]*>[\s\S]*?<div[^>]*style="flex:\s*1[^"]*"[^>]*>\s*([\w\s]+?)\s*<\/div>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1].replace(/&amp;/g, "&");
    const platform = match[2].trim();
    if (!platform || !url) continue;
    if (url.includes("prf.hn/click")) {
      const destMatch = url.match(/destination:(https?[^\s&]+)/);
      if (destMatch) url = decodeURIComponent(destMatch[1]);
    }
    links.push({ platform: platform.toLowerCase().replace(/\s+/g, "_"), url });
  }
  return links;
}

// Convert title to candidate DistroKid slug(s)
function titleToSlugs(title: string): string[] {
  const base = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheticals
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  if (!base) return []; // Chinese-only titles produce empty slugs

  // Try base slug, then numbered variants (DistroKid appends -2, -3, etc. for duplicates)
  const candidates = [base];
  for (let i = 2; i <= 6; i++) {
    candidates.push(`${base}-${i}`);
  }
  return candidates;
}

async function scrapeOneHyperFollow(
  url: string,
  releaseId: string,
  firecrawlKey: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ found: boolean; linkCount: number }> {
  try {
    const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['html'], waitFor: 5000 }),
    });
    if (!fcRes.ok) return { found: false, linkCount: 0 };
    const fcData = await fcRes.json();
    const html = fcData?.data?.html || fcData?.html || '';
    if (!html || html.length < 100) return { found: false, linkCount: 0 };

    const links = extractStreamingLinks(html);
    if (links.length === 0) return { found: false, linkCount: 0 };

    // Upsert streaming links
    await fetch(`${supabaseUrl}/rest/v1/streaming_links`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(links.map(l => ({ release_id: releaseId, platform: l.platform, url: l.url }))),
    });

    // Save hyperfollow_url on the release
    await fetch(`${supabaseUrl}/rest/v1/releases?id=eq.${releaseId}`, {
      method: 'PATCH',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ hyperfollow_url: url }),
    });

    return { found: true, linkCount: links.length };
  } catch (e) {
    console.warn(`Error scraping ${url}:`, e);
    return { found: false, linkCount: 0 };
  }
}

async function discoverAndScrapeHyperFollow(supabaseUrl: string, serviceRoleKey: string, batchSize: number = 10): Promise<{ discovered: number; scraped: number; skipped: number; remaining: number; failed: string[] }> {
  let discovered = 0, scraped = 0, skipped = 0;
  const failed: string[] = [];

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.warn('FIRECRAWL_API_KEY not configured, skipping HyperFollow');
    return { discovered, scraped, skipped, failed };
  }

  // Get all releases + check which already have streaming links
  const [relRes, linksRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/releases?select=id,title,hyperfollow_url&order=sort_order.asc&limit=1000`, {
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` },
    }),
    fetch(`${supabaseUrl}/rest/v1/streaming_links?select=release_id`, {
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` },
    }),
  ]);

  const releases = await relRes.json();
  const existingLinks = await linksRes.json();
  const hasLinks = new Set((existingLinks || []).map((l: any) => l.release_id));

  // Filter to releases that need scraping
  const needsScraping = (releases || []).filter((r: any) => !hasLinks.has(r.id));
  const totalNeeded = needsScraping.length;
  console.log(`${totalNeeded} of ${releases.length} releases need streaming links (processing up to ${batchSize})`);
  const toProcess = needsScraping.slice(0, batchSize);

  const BASE_URL = 'https://distrokid.com/hyperfollow/colab2/';

  for (const release of toProcess) {
    // If already has a hyperfollow_url, use it directly
    if (release.hyperfollow_url) {
      console.log(`Scraping known URL for \"${release.title}\": ${release.hyperfollow_url}`);
      const result = await scrapeOneHyperFollow(release.hyperfollow_url, release.id, firecrawlKey, supabaseUrl, serviceRoleKey);
      if (result.found) {
        scraped++;
        console.log(`  ✓ Found ${result.linkCount} links`);
      } else {
        failed.push(release.title);
        console.log(`  ✗ No links found`);
      }
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }

    // Generate candidate slugs from title
    const candidates = titleToSlugs(release.title);
    if (candidates.length === 0) {
      skipped++;
      console.log(`Skipped \"${release.title}\" (no valid slug)`);
      continue;
    }

    let found = false;
    for (const slug of candidates) {
      const url = `${BASE_URL}${slug}`;
      const result = await scrapeOneHyperFollow(url, release.id, firecrawlKey, supabaseUrl, serviceRoleKey);
      if (result.found) {
        discovered++;
        scraped++;
        found = true;
        console.log(`✓ \"${release.title}\" -> ${slug} (${result.linkCount} links)`);
        break;
      }
      // Small delay between slug attempts
      await new Promise(r => setTimeout(r, 800));
    }

    if (!found) {
      failed.push(release.title);
      console.log(`✗ \"${release.title}\" - no valid HyperFollow page found`);
    }

    // Rate limit between releases
    await new Promise(r => setTimeout(r, 1000));
  }

  return { discovered, scraped, skipped, failed };
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testMode = body?.test === true;
    const hyperfollowOnly = body?.hyperfollow_only === true;
    const handle = '@Cola_BB';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // HyperFollow-only mode: skip YouTube scraping, just scrape streaming links per-release
    if (hyperfollowOnly) {
      console.log('Running HyperFollow-only mode...');
      const result = await discoverAndScrapeHyperFollow(supabaseUrl, serviceRoleKey);
      const summary = { success: true, mode: 'hyperfollow_only', ...result, timestamp: new Date().toISOString() };
      console.log('HyperFollow sync complete:', JSON.stringify(summary));
      return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Starting sync for ${handle} (test=${testMode})...`);

    // Step 1: Scrape /releases page + resolve channel ID + fetch RSS in parallel
    const [scrapedReleases, channelId] = await Promise.all([
      fetchReleasesPage(handle),
      resolveChannelId(handle),
    ]);

    if (scrapedReleases.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No releases found', inserted: 0, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch RSS feed for video descriptions (if we got channel ID)
    const rssMap = channelId ? await fetchRssDescriptions(channelId) : new Map();

    const toProcess = testMode ? scrapedReleases.slice(0, 2) : scrapedReleases;
    console.log(`Processing ${toProcess.length} releases (RSS has ${rssMap.size} videos)...`);

    // Step 2: Enrich (5 at a time, 500ms delay)
    const enriched = await processInBatches(toProcess, 5, 500, (r) => enrichRelease(r, rssMap));

    const stats = {
      thumbnails: enriched.filter(r => r.thumbnail_url).length,
      descriptions: enriched.filter(r => r.description).length,
      years: enriched.filter(r => r.year).length,
      videoIds: enriched.filter(r => r.video_id).length,
    };
    console.log(`Enriched:`, JSON.stringify(stats));

    // Step 3: Upsert
    const { inserted, updated } = await upsertReleases(enriched);

    // Step 4: HyperFollow scraping should be triggered separately with { hyperfollow_only: true }

    const summary = {
      success: true, total: toProcess.length, inserted, updated, ...stats,
      timestamp: new Date().toISOString(),
    };
    console.log('Sync complete:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
