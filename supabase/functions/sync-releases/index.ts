const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

interface ScrapedRelease {
  title: string;
  playlistId: string;
  trackCount?: number;
}

interface EnrichedRelease {
  title: string;
  playlist_id: string;
  video_id: string | null;
  thumbnail_url: string | null;
  description: string | null;
  release_date: string | null;
  track_count: number | null;
  year: string | null;
}

// ── Scrape /releases page ──────────────────────────────────────

async function fetchReleasesPage(handle: string): Promise<ScrapedRelease[]> {
  const url = `https://www.youtube.com/${handle}/releases`;
  const res = await fetch(url, { headers: YT_HEADERS });
  if (!res.ok) throw new Error(`Releases page: ${res.status}`);
  const html = await res.text();

  const match = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  const releases: ScrapedRelease[] = [];
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

  for (const tab of tabs) {
    const items = tab?.tabRenderer?.content?.richGridRenderer?.contents || [];
    for (const item of items) {
      const pl = item?.richItemRenderer?.content?.playlistRenderer;
      if (pl?.playlistId) {
        releases.push({
          title: pl.title?.simpleText || pl.title?.runs?.[0]?.text || 'Unknown',
          playlistId: pl.playlistId,
          trackCount: pl.videoCount ? parseInt(pl.videoCount) : undefined,
        });
      }
      for (const si of (item?.richShelfRenderer?.contents || [])) {
        const spl = si?.richItemRenderer?.content?.playlistRenderer;
        if (spl?.playlistId) {
          releases.push({
            title: spl.title?.simpleText || spl.title?.runs?.[0]?.text || 'Unknown',
            playlistId: spl.playlistId,
            trackCount: spl.videoCount ? parseInt(spl.videoCount) : undefined,
          });
        }
      }
    }
  }

  console.log(`Scraped ${releases.length} releases from /releases page`);
  return releases;
}

// ── Resolve channel ID from handle ──────────────────────────────

async function resolveChannelId(handle: string): Promise<string | null> {
  const res = await fetch(`https://www.youtube.com/${handle}`, { headers: YT_HEADERS });
  if (!res.ok) return null;
  const html = await res.text();
  const patterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /channel_id=(UC[a-zA-Z0-9_-]{22})/,
    /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Fetch RSS feed for video descriptions ──────────────────────

interface RssVideoInfo {
  videoId: string;
  title: string;
  description: string;
  published: string;
}

async function fetchRssDescriptions(channelId: string): Promise<Map<string, RssVideoInfo>> {
  const map = new Map<string, RssVideoInfo>();
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(rssUrl);
  if (!res.ok) return map;

  const xml = await res.text();
  const entries = xml.split('<entry>').slice(1);

  for (const entry of entries) {
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<media:title>([^<]+)<\/media:title>/);
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const pubMatch = entry.match(/<published>([^<]+)<\/published>/);

    if (videoIdMatch) {
      map.set(videoIdMatch[1], {
        videoId: videoIdMatch[1],
        title: titleMatch?.[1] || '',
        description: descMatch?.[1]?.trim() || '',
        published: pubMatch?.[1] || '',
      });
    }
  }

  console.log(`RSS feed: ${map.size} videos with descriptions`);
  return map;
}

// ── Enrich release from playlist page ──────────────────────────

async function enrichRelease(
  release: ScrapedRelease,
  rssMap: Map<string, RssVideoInfo>
): Promise<EnrichedRelease> {
  const result: EnrichedRelease = {
    title: release.title,
    playlist_id: release.playlistId,
    video_id: null,
    thumbnail_url: null,
    description: null,
    release_date: null,
    track_count: release.trackCount ?? null,
    year: null,
  };

  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${release.playlistId}`;
    const res = await fetch(playlistUrl, { headers: YT_HEADERS });
    if (!res.ok) return result;
    const html = await res.text();

    // og:image → artwork
    const ogImg = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImg) result.thumbnail_url = ogImg[1];

    // Parse ytInitialData
    const ytMatch = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
    if (ytMatch) {
      const ytData = JSON.parse(ytMatch[1]);

      // Find first video ID
      const videoContents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
        ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];

      for (const item of videoContents) {
        const vr = item?.playlistVideoRenderer;
        if (vr?.videoId) {
          result.video_id = vr.videoId;
          // Check if we have RSS description for this video
          const rssInfo = rssMap.get(vr.videoId);
          if (rssInfo?.description) {
            result.description = rssInfo.description;
            // Extract year from description
            const yearMatch = rssInfo.description.match(/\b(20\d{2})\b/);
            if (yearMatch) result.year = yearMatch[1];
            // Extract release date
            const dateMatch = rssInfo.description.match(/Released on:\s*(.+)/i)
              || rssInfo.description.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) result.release_date = dateMatch[1].trim();
          }
          if (rssInfo?.published && !result.year) {
            const pubYear = rssInfo.published.match(/(\d{4})/);
            if (pubYear) result.year = pubYear[1];
          }
          break;
        }
      }

      // Sidebar stats for year/description
      const sidebar = ytData?.sidebar?.playlistSidebarRenderer?.items || [];
      for (const item of sidebar) {
        const primary = item?.playlistSidebarPrimaryInfoRenderer;
        if (primary) {
          const desc = primary?.description?.simpleText ||
            primary?.description?.runs?.map((r: any) => r.text).join('') || '';
          if (desc.length > 5 && (!result.description || desc.length > result.description.length)) {
            result.description = desc;
          }
          for (const stat of (primary?.stats || [])) {
            const text = stat?.simpleText || stat?.runs?.map((r: any) => r.text).join('') || '';
            const ym = text.match(/\b(20\d{2})\b/);
            if (ym && !result.year) {
              result.year = ym[1];
              result.release_date = text;
            }
          }
        }
      }

      // Header year
      const header = ytData?.header?.playlistHeaderRenderer;
      if (header && !result.year) {
        const subtitle = header?.subtitle?.simpleText || header?.subtitle?.runs?.map((r: any) => r.text).join('') || '';
        const ym = subtitle.match(/\b(20\d{2})\b/);
        if (ym) result.year = ym[1];
      }
    }

    // If we found a video_id but no description yet, try other videos in RSS
    if (result.video_id && !result.description) {
      const rssInfo = rssMap.get(result.video_id);
      if (rssInfo?.description) {
        result.description = rssInfo.description;
      }
    }

    // Extract year from description if still missing
    if (!result.year && result.description) {
      const ym = result.description.match(/\b(20\d{2})\b/);
      if (ym) result.year = ym[1];
    }
  } catch (e) {
    console.error(`Error enriching ${release.title}:`, e);
  }

  return result;
}

// ── Upsert to database ────────────────────────────────────────

async function upsertReleases(releases: EnrichedRelease[]): Promise<{ inserted: number; updated: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  let inserted = 0, updated = 0;

  for (const release of releases) {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/releases?playlist_id=eq.${encodeURIComponent(release.playlist_id)}&select=id,thumbnail_url,description`,
      { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
    );
    const existing = await checkRes.json();

    if (existing.length > 0) {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        title: release.title,
      };
      if (release.thumbnail_url) updates.thumbnail_url = release.thumbnail_url;
      if (release.description && (!existing[0].description || release.description.length > (existing[0].description?.length || 0))) {
        updates.description = release.description;
      }
      if (release.video_id) updates.video_id = release.video_id;
      if (release.release_date) updates.release_date = release.release_date;
      if (release.year) updates.year = release.year;
      if (release.track_count) updates.track_count = release.track_count;

      await fetch(
        `${supabaseUrl}/rest/v1/releases?playlist_id=eq.${encodeURIComponent(release.playlist_id)}`,
        {
          method: 'PATCH',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify(updates),
        }
      );
      updated++;
    } else {
      await fetch(
        `${supabaseUrl}/rest/v1/releases`,
        {
          method: 'POST',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ ...release, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        }
      );
      inserted++;
    }
  }

  return { inserted, updated };
}

// ── Batch processing ──────────────────────────────────────────

async function processInBatches<T, R>(items: T[], batchSize: number, delayMs: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...await Promise.all(batch.map(fn)));
    if (i + batchSize < items.length) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testMode = body?.test === true;
    const handle = '@Cola_BB';

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

    // Step 2: Enrich (3 at a time, 500ms delay)
    const enriched = await processInBatches(toProcess, 3, 500, (r) => enrichRelease(r, rssMap));

    const stats = {
      thumbnails: enriched.filter(r => r.thumbnail_url).length,
      descriptions: enriched.filter(r => r.description).length,
      years: enriched.filter(r => r.year).length,
      videoIds: enriched.filter(r => r.video_id).length,
    };
    console.log(`Enriched:`, JSON.stringify(stats));

    // Step 3: Upsert
    const { inserted, updated } = await upsertReleases(enriched);

    const summary = { success: true, total: toProcess.length, inserted, updated, ...stats, timestamp: new Date().toISOString() };
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
