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
  const seen = new Set<string>();

  // Method 1: Match rendered anchor tags with platform names
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
    const key = platform.toLowerCase().replace(/\s+/g, "_");
    if (!seen.has(key)) { seen.add(key); links.push({ platform: key, url }); }
  }

  // Method 2: Extract from embedded JSON/props in script tags
  // DistroKid pages often embed link data as JSON
  const jsonRegex = /"url"\s*:\s*"(https?:\/\/[^"]+)"[^}]*"name"\s*:\s*"([^"]+)"/gi;
  while ((match = jsonRegex.exec(html)) !== null) {
    const url = match[1].replace(/\\u002F/g, '/').replace(/&amp;/g, "&");
    const platform = match[2].trim().toLowerCase().replace(/\s+/g, "_");
    if (!seen.has(platform)) { seen.add(platform); links.push({ platform, url }); }
  }
  // Also try reversed order (name before url)
  const jsonRegex2 = /"name"\s*:\s*"([^"]+)"[^}]*"url"\s*:\s*"(https?:\/\/[^"]+)"/gi;
  while ((match = jsonRegex2.exec(html)) !== null) {
    const platform = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    const url = match[2].replace(/\\u002F/g, '/').replace(/&amp;/g, "&");
    if (!seen.has(platform)) { seen.add(platform); links.push({ platform, url }); }
  }

  return links;
}

// Convert title to candidate DistroKid slug(s)
function titleToSlugs(title: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const addSlug = (s: string) => {
    if (s && !seen.has(s)) { seen.add(s); candidates.push(s); }
  };

  // Try with parentheticals removed first
  const withoutParens = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  // Also try with parentheticals kept (e.g. "排在最後 (Cola Version)" -> "-cola-version")
  const withParens = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  // Add base slugs
  addSlug(withoutParens);
  addSlug(withParens);

  // Add numbered variants for the primary slug
  const primary = withoutParens || withParens;
  if (!primary) return [];

  for (let i = 2; i <= 5; i++) {
    addSlug(`${primary}-${i}`);
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
    // Quick existence check with plain fetch (avoids expensive Firecrawl call for 404s)
    const checkRes = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const checkHtml = await checkRes.text();
    // DistroKid pages that don't exist redirect to distrokid.com or show minimal content
    if (!checkRes.ok || checkHtml.length < 500 || checkHtml.includes('Page Not Found') || !checkHtml.includes('hyperDspLink')) {
      return { found: false, linkCount: 0 };
    }

    // Page exists — now use Firecrawl for JS-rendered content
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

// Use Firecrawl Map to discover all URLs, then match unlinked releases by scraping page titles
async function mapAndMatchHyperFollow(supabaseUrl: string, serviceRoleKey: string, batchSize: number = 10): Promise<{ matched: number; scraped: number; failed: string[]; remaining: number }> {
  let matched = 0, scraped = 0;
  const failed: string[] = [];

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) return { matched, scraped, failed, remaining: 0 };

  // 1. Get all URLs under the artist page via Firecrawl Map
  console.log('Mapping all URLs under colab2...');
  const mapRes = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://distrokid.com/hyperfollow/colab2/', limit: 5000, includeSubdomains: false }),
  });
  if (!mapRes.ok) {
    console.error('Firecrawl Map failed:', mapRes.status);
    return { matched, scraped, failed, remaining: 0 };
  }
  const mapData = await mapRes.json();
  const allUrls: string[] = (mapData?.links || mapData?.data || []).filter((u: string) =>
    u.startsWith('https://distrokid.com/hyperfollow/colab2/')
  );
  console.log(`Map returned ${allUrls.length} URLs`);

  // 2. Get releases that still need links + already-known hyperfollow URLs
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

  const needsScraping = (releases || []).filter((r: any) => !hasLinks.has(r.id));
  console.log(`${needsScraping.length} releases need streaming links`);

  // 3. Filter out URLs we've already matched
  const knownUrls = new Set((releases || []).filter((r: any) => r.hyperfollow_url).map((r: any) => r.hyperfollow_url));
  const unknownUrls = allUrls.filter(u => !knownUrls.has(u));
  console.log(`${unknownUrls.length} URLs not yet matched to any release`);

  // 4. Normalize titles for matching
  function normalizeForMatch(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u4e00-\u9fff]+/g, '').trim();
  }

  const unmatchedReleases = needsScraping.map((r: any) => ({ ...r, normalized: normalizeForMatch(r.title) }));
  const toScrape = unknownUrls.slice(0, batchSize);

  // 5. For each unknown URL, scrape it to find the title and try to match
  for (const url of toScrape) {
    try {
      // Quick fetch to get page title
      const checkRes = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!checkRes.ok) continue;
      const html = await checkRes.text();
      if (html.length < 500) continue;

      // Extract title from page
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
      const pageTitle = ogTitleMatch?.[1] || titleMatch?.[1] || '';
      const normalizedPageTitle = normalizeForMatch(pageTitle);

      if (!normalizedPageTitle) continue;
      console.log(`  URL ${url} -> page title: "${pageTitle}"`);

      // Try to match against unmatched releases
      let matchedRelease = null;
      for (const r of unmatchedReleases) {
        if (!r.normalized) continue;
        if (normalizedPageTitle.includes(r.normalized) || r.normalized.includes(normalizedPageTitle)) {
          matchedRelease = r;
          break;
        }
      }

      if (!matchedRelease) {
        console.log(`  No release match for "${pageTitle}"`);
        continue;
      }

      console.log(`  Matched "${matchedRelease.title}" -> "${pageTitle}"`);

      // First try extracting links from the initial HTML (embedded JSON)
      let links = extractStreamingLinks(html);

      // If no links found, try Firecrawl for JS-rendered content with longer wait
      if (links.length === 0) {
        const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, formats: ['html'], waitFor: 10000 }),
        });
        if (fcRes.ok) {
          const fcData = await fcRes.json();
          const renderedHtml = fcData?.data?.html || fcData?.html || '';
          links = extractStreamingLinks(renderedHtml);
          console.log(`  Firecrawl rendered HTML length: ${renderedHtml.length}, links found: ${links.length}`);
        }
      } else {
        console.log(`  Found ${links.length} links from initial HTML`);
      }

      if (links.length === 0) {
        console.log(`  No streaming links found for "${matchedRelease.title}"`);
        failed.push(matchedRelease.title);
        continue;
      }

      // Save links + hyperfollow_url
      await fetch(`${supabaseUrl}/rest/v1/streaming_links`, {
        method: 'POST',
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(links.map(l => ({ release_id: matchedRelease.id, platform: l.platform, url: l.url }))),
      });
      await fetch(`${supabaseUrl}/rest/v1/releases?id=eq.${matchedRelease.id}`, {
        method: 'PATCH',
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ hyperfollow_url: url }),
      });

      matched++;
      scraped++;
      console.log(`  ✓ Saved ${links.length} streaming links`);

      // Remove from unmatched list
      const idx = unmatchedReleases.findIndex(r => r.id === matchedRelease.id);
      if (idx >= 0) unmatchedReleases.splice(idx, 1);

      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn(`Error processing ${url}:`, e);
    }
  }

  return { matched, scraped, failed: unmatchedReleases.map(r => r.title), remaining: unknownUrls.length - toScrape.length };
}

async function discoverAndScrapeHyperFollow(supabaseUrl: string, serviceRoleKey: string, batchSize: number = 20): Promise<{ discovered: number; scraped: number; skipped: number; remaining: number; failed: string[] }> {
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
      await new Promise(r => setTimeout(r, 500));
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
      await new Promise(r => setTimeout(r, 300));
    }

    if (!found) {
      failed.push(release.title);
      console.log(`✗ \"${release.title}\" - no valid HyperFollow page found`);
    }

    // Rate limit between releases
    await new Promise(r => setTimeout(r, 500));
  }

  return { discovered, scraped, skipped, remaining: totalNeeded - toProcess.length, failed };
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

    // Map & match mode: use Firecrawl Map to discover URLs, then match by page title
    if (body?.map_and_match) {
      const batchSize = body?.batch_size || 15;
      console.log(`Running map_and_match mode (batch_size=${batchSize})...`);
      const result = await mapAndMatchHyperFollow(supabaseUrl, serviceRoleKey, batchSize);
      const summary = { success: true, mode: 'map_and_match', ...result, timestamp: new Date().toISOString() };
      console.log('Map & match complete:', JSON.stringify(summary));
      return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // HyperFollow-only mode: skip YouTube scraping, just scrape streaming links per-release
    if (hyperfollowOnly) {
      const batchSize = body?.batch_size || 10;
      console.log(`Running HyperFollow-only mode (batch_size=${batchSize})...`);
      const result = await discoverAndScrapeHyperFollow(supabaseUrl, serviceRoleKey, batchSize);
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
