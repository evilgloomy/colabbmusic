const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── YouTube Data API v3 ────────────────────────────────────────

const CHANNEL_ID = 'UCCoEVSxdgOn_gcFI2jEFUEQ'; // Cola B VEVO

interface YTPlaylistItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail_url: string;
  publishedAt: string;
}

async function fetchChannelUploads(apiKey: string): Promise<YTPlaylistItem[]> {
  // 1. Get the "uploads" playlist ID from the channel
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`;
  console.log('Fetching channel info...');
  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) throw new Error(`Channel API error: ${channelRes.status} ${await channelRes.text()}`);
  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error('Could not find uploads playlist');
  console.log(`Uploads playlist: ${uploadsPlaylistId}`);

  // 2. Paginate through all uploads
  const items: YTPlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`PlaylistItems API error: ${res.status} ${await res.text()}`);
    const data = await res.json();

    for (const item of data.items || []) {
      const snippet = item.snippet;
      const videoId = snippet?.resourceId?.videoId;
      if (!videoId) continue;

      const thumb = snippet.thumbnails?.maxres?.url
        || snippet.thumbnails?.high?.url
        || snippet.thumbnails?.medium?.url
        || snippet.thumbnails?.default?.url
        || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

      items.push({
        videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        thumbnail_url: thumb,
        publishedAt: snippet.publishedAt || '',
      });
    }

    pageToken = data.nextPageToken;
    console.log(`Fetched ${items.length} videos so far...`);
  } while (pageToken);

  console.log(`Total uploads found: ${items.length}`);
  return items;
}

// Also search for releases from the artist channel (non-VEVO)
const ARTIST_CHANNEL_ID = 'UC...'; // Will be resolved if needed

async function searchChannelVideos(apiKey: string, channelId: string, query?: string): Promise<YTPlaylistItem[]> {
  const items: YTPlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('order', 'date');
    url.searchParams.set('key', apiKey);
    if (query) url.searchParams.set('q', query);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) break; // Non-fatal
    const data = await res.json();

    for (const item of data.items || []) {
      const snippet = item.snippet;
      const videoId = item.id?.videoId;
      if (!videoId) continue;

      items.push({
        videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        thumbnail_url: snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: snippet.publishedAt || '',
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken && items.length < 200);

  return items;
}

// ── Enrichment + DB upsert ──────────────────────────────────────

function enrichRelease(item: YTPlaylistItem): any {
  let year: number | null = null;
  const yearMatch = item.title?.match(/\((\d{4})\)$/);
  if (yearMatch) year = parseInt(yearMatch[1]);

  // Try to extract year from publishedAt
  if (!year && item.publishedAt) {
    year = new Date(item.publishedAt).getFullYear();
  }

  return {
    video_id: item.videoId,
    title: item.title,
    description: item.description || null,
    thumbnail_url: item.thumbnail_url,
    year: year ? String(year) : null,
    release_date: item.publishedAt ? item.publishedAt.split('T')[0] : null,
    sort_date: item.publishedAt ? item.publishedAt.split('T')[0] : null,
  };
}

async function upsertReleases(releases: any[]): Promise<{ inserted: number; updated: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Deduplicate by video_id (keep first occurrence)
  const seen = new Set<string>();
  const deduped = releases.filter(r => {
    if (!r.video_id || seen.has(r.video_id)) return false;
    seen.add(r.video_id);
    return true;
  });

  const res = await fetch(`${supabaseUrl}/rest/v1/releases?on_conflict=video_id`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(deduped),
  });

  if (!res.ok) {
    console.error('Upsert error:', res.status, await res.text());
    throw new Error(`HTTP error ${res.status} at upsert`);
  }

  const data = await res.json();
  const inserted = data.filter((r: any) => r.created_at === r.updated_at).length;
  const updated = data.length - inserted;

  console.log(`Upserted ${deduped.length} releases: ${inserted} inserted, ${updated} updated`);
  return { inserted, updated };
}

// ── HyperFollow per-release scraping ──

function extractStreamingLinks(html: string): { platform: string; url: string }[] {
  const links: { platform: string; url: string }[] = [];
  const seen = new Set<string>();

  const linkRegex =
    /<a[^>]+target=\"_blank\"[^>]+href=\"([^\"]+)\"[^>]*>[\s\S]*?<div[^>]*style=\"flex:\s*1[^\"]*\"[^>]*>\s*([\w\s]+?)\s*<\/div>/gi;
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

  const jsonRegex = /\"url\"\s*:\s*\"(https?:\/\/[^\"]+)\"[^}]*\"name\"\s*:\s*\"([^\"]+)\"/gi;
  while ((match = jsonRegex.exec(html)) !== null) {
    const url = match[1].replace(/\\u002F/g, '/').replace(/&amp;/g, "&");
    const platform = match[2].trim().toLowerCase().replace(/\s+/g, "_");
    if (!seen.has(platform)) { seen.add(platform); links.push({ platform, url }); }
  }
  const jsonRegex2 = /\"name\"\s*:\s*\"([^\"]+)\"[^}]*\"url\"\s*:\s*\"(https?:\/\/[^\"]+)\"/gi;
  while ((match = jsonRegex2.exec(html)) !== null) {
    const platform = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    const url = match[2].replace(/\\u002F/g, '/').replace(/&amp;/g, "&");
    if (!seen.has(platform)) { seen.add(platform); links.push({ platform, url }); }
  }

  return links;
}

function titleToSlugs(title: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const addSlug = (s: string) => { if (s && !seen.has(s)) { seen.add(s); candidates.push(s); } };

  const withoutParens = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  const withParens = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

  addSlug(withoutParens);
  addSlug(withParens);
  const primary = withoutParens || withParens;
  if (!primary) return [];
  for (let i = 2; i <= 5; i++) addSlug(`${primary}-${i}`);
  return candidates;
}

async function scrapeOneHyperFollow(url: string, releaseId: string, firecrawlKey: string, supabaseUrl: string, serviceRoleKey: string): Promise<{ found: boolean; linkCount: number }> {
  try {
    const checkRes = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const checkHtml = await checkRes.text();
    if (!checkRes.ok || checkHtml.length < 500 || checkHtml.includes('Page Not Found') || !checkHtml.includes('hyperDspLink')) {
      return { found: false, linkCount: 0 };
    }

    let links = extractStreamingLinks(checkHtml);
    if (links.length === 0) {
      const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats: ['html'], waitFor: 10000 }),
      });
      if (!fcRes.ok) return { found: false, linkCount: 0 };
      const fcData = await fcRes.json();
      const html = fcData?.data?.html || fcData?.html || '';
      if (!html || html.length < 100) return { found: false, linkCount: 0 };
      links = extractStreamingLinks(html);
    }

    if (links.length === 0) return { found: false, linkCount: 0 };

    await fetch(`${supabaseUrl}/rest/v1/streaming_links`, {
      method: 'POST',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(links.map(l => ({ release_id: releaseId, platform: l.platform, url: l.url }))),
    });
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

async function mapAndMatchHyperFollow(supabaseUrl: string, serviceRoleKey: string, batchSize: number = 10): Promise<{ matched: number; scraped: number; failed: string[]; remaining: number }> {
  let matched = 0, scraped = 0;
  const failed: string[] = [];

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) return { matched, scraped, failed, remaining: 0 };

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

  const knownUrls = new Set((releases || []).filter((r: any) => r.hyperfollow_url).map((r: any) => r.hyperfollow_url));
  const unknownUrls = allUrls.filter(u => !knownUrls.has(u));
  console.log(`${unknownUrls.length} URLs not yet matched to any release`);

  function normalizeForMatch(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u4e00-\u9fff]+/g, '').trim();
  }

  const unmatchedReleases = needsScraping.map((r: any) => ({ ...r, normalized: normalizeForMatch(r.title) }));
  const toScrape = unknownUrls.slice(0, batchSize);

  for (const url of toScrape) {
    try {
      const checkRes = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!checkRes.ok) continue;
      const html = await checkRes.text();
      if (html.length < 500) continue;

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
      const pageTitle = ogTitleMatch?.[1] || titleMatch?.[1] || '';
      const normalizedPageTitle = normalizeForMatch(pageTitle);
      if (!normalizedPageTitle) continue;
      console.log(`  URL ${url} -> page title: "${pageTitle}"`);

      let matchedRelease = null;
      for (const r of unmatchedReleases) {
        if (!r.normalized) continue;
        if (normalizedPageTitle.includes(r.normalized) || r.normalized.includes(normalizedPageTitle)) {
          matchedRelease = r;
          break;
        }
      }

      if (!matchedRelease) { console.log(`  No release match for "${pageTitle}"`); continue; }
      console.log(`  Matched "${matchedRelease.title}" -> "${pageTitle}"`);

      let links = extractStreamingLinks(html);
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
        }
      }

      if (links.length === 0) { failed.push(matchedRelease.title); continue; }

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
    return { discovered, scraped, skipped, failed, remaining: 0 };
  }

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
  const totalNeeded = needsScraping.length;
  console.log(`${totalNeeded} of ${releases.length} releases need streaming links (processing up to ${batchSize})`);
  const toProcess = needsScraping.slice(0, batchSize);
  const BASE_URL = 'https://distrokid.com/hyperfollow/colab2/';

  for (const release of toProcess) {
    if (release.hyperfollow_url) {
      const result = await scrapeOneHyperFollow(release.hyperfollow_url, release.id, firecrawlKey, supabaseUrl, serviceRoleKey);
      if (result.found) { scraped++; } else { failed.push(release.title); }
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    const candidates = titleToSlugs(release.title);
    if (candidates.length === 0) { skipped++; continue; }

    let found = false;
    for (const slug of candidates) {
      const url = `${BASE_URL}${slug}`;
      const result = await scrapeOneHyperFollow(url, release.id, firecrawlKey, supabaseUrl, serviceRoleKey);
      if (result.found) { discovered++; scraped++; found = true; break; }
      await new Promise(r => setTimeout(r, 300));
    }

    if (!found) failed.push(release.title);
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    // Map & match mode
    if (body?.map_and_match) {
      const batchSize = body?.batch_size || 15;
      console.log(`Running map_and_match mode (batch_size=${batchSize})...`);
      const result = await mapAndMatchHyperFollow(supabaseUrl, serviceRoleKey, batchSize);
      const summary = { success: true, mode: 'map_and_match', ...result, timestamp: new Date().toISOString() };
      console.log('Map & match complete:', JSON.stringify(summary));
      return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // HyperFollow-only mode
    if (hyperfollowOnly) {
      const batchSize = body?.batch_size || 10;
      console.log(`Running HyperFollow-only mode (batch_size=${batchSize})...`);
      const result = await discoverAndScrapeHyperFollow(supabaseUrl, serviceRoleKey, batchSize);
      const summary = { success: true, mode: 'hyperfollow_only', ...result, timestamp: new Date().toISOString() };
      console.log('HyperFollow sync complete:', JSON.stringify(summary));
      return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Main sync: YouTube Data API ──
    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'YOUTUBE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting YouTube Data API sync (test=${testMode})...`);

    // Step 1: Fetch all uploads via YouTube Data API
    const uploads = await fetchChannelUploads(youtubeApiKey);

    if (uploads.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No uploads found', inserted: 0, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const toProcess = testMode ? uploads.slice(0, 3) : uploads;
    console.log(`Processing ${toProcess.length} uploads...`);

    // Step 2: Enrich
    const enriched = toProcess.map(enrichRelease);

    // Step 3: Upsert
    const { inserted, updated } = await upsertReleases(enriched);

    // Step 4: Cache album art thumbnails to storage
    let artCached = 0;
    try {
      const storageBase = `${supabaseUrl}/storage/v1`;
      const publicBase = `${supabaseUrl}/storage/v1/object/public/album-art`;

      const freshRes = await fetch(
        `${supabaseUrl}/rest/v1/releases?select=id,title,video_id,thumbnail_url&order=sort_order.asc&limit=1000`,
        { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
      );
      const freshReleases = await freshRes.json();

      for (const rel of freshReleases) {
        if (rel.thumbnail_url?.includes(supabaseUrl)) continue;

        const sources = [
          rel.thumbnail_url?.replace(/&amp;/g, '&'),
          rel.video_id ? `https://i.ytimg.com/vi/${rel.video_id}/maxresdefault.jpg` : null,
          rel.video_id ? `https://img.youtube.com/vi/${rel.video_id}/mqdefault.jpg` : null,
        ].filter(Boolean) as string[];

        let imageData: ArrayBuffer | null = null;
        let contentType = 'image/jpeg';
        for (const src of sources) {
          try {
            const r = await fetch(src);
            if (r.ok && r.headers.get('content-type')?.startsWith('image/')) {
              imageData = await r.arrayBuffer();
              contentType = r.headers.get('content-type') || 'image/jpeg';
              if (imageData.byteLength < 1000) { imageData = null; continue; }
              break;
            }
          } catch { /* next */ }
        }
        if (!imageData) continue;

        const uploadRes = await fetch(`${storageBase}/object/album-art/${rel.id}.jpg`, {
          method: 'PUT',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': contentType, 'x-upsert': 'true' },
          body: imageData,
        });
        if (!uploadRes.ok) continue;

        await fetch(`${supabaseUrl}/rest/v1/releases?id=eq.${rel.id}`, {
          method: 'PATCH',
          headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ thumbnail_url: `${publicBase}/${rel.id}.jpg` }),
        });
        artCached++;
        await new Promise(r => setTimeout(r, 200));
      }
      console.log(`Cached ${artCached} album art thumbnails`);
    } catch (e) {
      console.warn('Album art caching error (non-fatal):', e);
    }

    const summary = {
      success: true,
      source: 'youtube_data_api',
      total: toProcess.length,
      inserted,
      updated,
      artCached,
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
