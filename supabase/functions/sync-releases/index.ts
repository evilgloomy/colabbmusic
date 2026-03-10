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
  sortOrder: number;
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
  sort_date: string | null;
  sort_order: number;
}

// ── Extract releases from richGridRenderer contents ───────────

function extractReleasesFromItems(items: any[], startIndex: number): { releases: ScrapedRelease[]; nextIndex: number } {
  const releases: ScrapedRelease[] = [];
  let idx = startIndex;
  for (const item of items) {
    const pl = item?.richItemRenderer?.content?.playlistRenderer;
    if (pl?.playlistId) {
      releases.push({
        title: pl.title?.simpleText || pl.title?.runs?.[0]?.text || 'Unknown',
        playlistId: pl.playlistId,
        trackCount: pl.videoCount ? parseInt(pl.videoCount) : undefined,
        sortOrder: idx++,
      });
    }
    for (const si of (item?.richShelfRenderer?.contents || [])) {
      const spl = si?.richItemRenderer?.content?.playlistRenderer;
      if (spl?.playlistId) {
        releases.push({
          title: spl.title?.simpleText || spl.title?.runs?.[0]?.text || 'Unknown',
          playlistId: spl.playlistId,
          trackCount: spl.videoCount ? parseInt(spl.videoCount) : undefined,
          sortOrder: idx++,
        });
      }
    }
  }
  return { releases, nextIndex: idx };
}

// ── Extract continuation token from items array ───────────────

function extractContinuationToken(items: any[]): string | null {
  for (const item of items) {
    const token = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (token) return token;
  }
  return null;
}

// ── Fetch continuation page via InnerTube browse API ──────────

async function fetchContinuation(token: string, visitorData: string | null): Promise<{ items: any[]; nextToken: string | null }> {
  const payload = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20260101.00.00",
        hl: "en",
        gl: "US",
      },
    },
    continuation: token,
  };

  const headers: Record<string, string> = {
    ...YT_HEADERS,
    'Content-Type': 'application/json',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
  };
  if (visitorData) {
    headers['X-Goog-Visitor-Id'] = visitorData;
  }

  const res = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`InnerTube browse failed: ${res.status}`);
    return { items: [], nextToken: null };
  }

  const data = await res.json();
  const actions = data?.onResponseReceivedActions || [];
  for (const action of actions) {
    const continuationItems = action?.appendContinuationItemsAction?.continuationItems;
    if (continuationItems) {
      const nextToken = extractContinuationToken(continuationItems);
      return { items: continuationItems, nextToken };
    }
  }

  return { items: [], nextToken: null };
}

// ── Scrape /releases page with pagination ─────────────────────

async function fetchReleasesPage(handle: string): Promise<ScrapedRelease[]> {
  const url = `https://www.youtube.com/${handle}/releases`;
  const res = await fetch(url, { headers: YT_HEADERS });
  if (!res.ok) throw new Error(`Releases page: ${res.status}`);
  const html = await res.text();

  const match = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  
  // Extract visitorData for subsequent requests
  const visitorData = data?.responseContext?.visitorData || null;
  
  const allReleases: ScrapedRelease[] = [];
  const seenIds = new Set<string>();
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  let runningIndex = 0;

  for (const tab of tabs) {
    const items = tab?.tabRenderer?.content?.richGridRenderer?.contents || [];
    
    // Extract releases from initial page
    const { releases: initial, nextIndex } = extractReleasesFromItems(items, runningIndex);
    runningIndex = nextIndex;
    for (const r of initial) {
      if (!seenIds.has(r.playlistId)) {
        seenIds.add(r.playlistId);
        allReleases.push(r);
      }
    }

    // Get continuation token from initial items
    let continuationToken = extractContinuationToken(items);
    let page = 1;

    while (continuationToken) {
      console.log(`Fetching continuation page ${page} (${allReleases.length} releases so far)...`);
      await new Promise(r => setTimeout(r, 800)); // Rate limit

      const { items: nextItems, nextToken } = await fetchContinuation(continuationToken, visitorData);
      const { releases: nextReleases, nextIndex: ni } = extractReleasesFromItems(nextItems, runningIndex);
      runningIndex = ni;
      
      for (const r of nextReleases) {
        if (!seenIds.has(r.playlistId)) {
          seenIds.add(r.playlistId);
          allReleases.push(r);
        }
      }

      console.log(`Page ${page}: found ${nextReleases.length} new releases`);
      continuationToken = nextToken;
      page++;

      if (page > 20) { // Safety limit
        console.warn('Hit pagination safety limit (20 pages)');
        break;
      }
    }
  }

  console.log(`Scraped ${allReleases.length} total releases from /releases page (${seenIds.size} unique)`);
  return allReleases;
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

// ── Fetch actual publish date from a video page ───────────────

async function fetchVideoPublishDate(videoId: string): Promise<string | null> {
  try {
    const payload = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20260101.00.00",
          hl: "en",
          gl: "US",
        },
      },
      videoId,
    };
    const headers: Record<string, string> = {
      ...YT_HEADERS,
      'Content-Type': 'application/json',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
    };

    // Try player API first (works for regular videos)
    const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST', headers, body: JSON.stringify(payload),
    });
    if (playerRes.ok) {
      const playerData = await playerRes.json();
      const micro = playerData?.microformat?.playerMicroformatRenderer;
      if (micro?.publishDate) return micro.publishDate;
      if (micro?.uploadDate) return micro.uploadDate;
    }

    // Fallback: next API (returns dateText for Art Tracks)
    const nextRes = await fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false', {
      method: 'POST', headers, body: JSON.stringify(payload),
    });
    if (nextRes.ok) {
      const nextData = await nextRes.json();
      // dateText location in the response
      const results = nextData?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
      for (const content of results) {
        const dateText = content?.videoPrimaryInfoRenderer?.dateText?.simpleText;
        if (dateText) {
          console.log(`Found dateText for ${videoId}: ${dateText}`);
          const parsed = parseDateText(dateText);
          if (parsed) return parsed;
        }
        // Also check for musicVideoDetails or engagement panel
        const runs = content?.videoPrimaryInfoRenderer?.dateText?.runs;
        if (runs) {
          const text = runs.map((r: any) => r.text).join('');
          console.log(`Found dateText runs for ${videoId}: ${text}`);
          const parsed = parseDateText(text);
          if (parsed) return parsed;
        }
      }
      // Try engagement panels for music track info
      const panels = nextData?.engagementPanels || [];
      for (const panel of panels) {
        const items = panel?.engagementPanelSectionListRenderer?.content?.structuredDescriptionContentRenderer?.items || [];
        for (const item of items) {
          const rows = item?.videoDescriptionMusicSectionRenderer?.carouselLockups?.[0]
            ?.carouselLockupRenderer?.infoRows || [];
          for (const row of rows) {
            const label = row?.infoRowRenderer?.title?.simpleText || '';
            const value = row?.infoRowRenderer?.defaultMetadata?.simpleText || '';
            if (label.toLowerCase().includes('release') && value) {
              console.log(`Found music section release date for ${videoId}: ${value}`);
              const parsed = parseDateText(value);
              if (parsed) return parsed;
            }
          }
        }
      }
    }

    console.warn(`No publish date found for ${videoId}`);
    return null;
  } catch (e) {
    console.error(`Error fetching publish date for ${videoId}:`, e);
    return null;
  }
}

// Parse date text like "May 12, 2023" or "2023年5月12日" into ISO date
function parseDateText(text: string): string | null {
  // English: "May 12, 2023"
  const enMatch = text.match(/(\w{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (enMatch) {
    const monthNames: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const month = monthNames[enMatch[1].toLowerCase()];
    if (month) return `${enMatch[3]}-${month}-${enMatch[2].padStart(2, '0')}`;
  }
  // ISO
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Chinese: "2023年5月12日"
  const cnMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) return `${cnMatch[1]}-${cnMatch[2].padStart(2, '0')}-${cnMatch[3].padStart(2, '0')}`;
  return null;
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
    sort_date: null,
    sort_order: release.sortOrder,
  };

  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${release.playlistId}`;
    const res = await fetch(playlistUrl, { headers: YT_HEADERS });
    if (!res.ok) return result;
    const html = await res.text();

    // og:image → artwork (decode HTML entities)
    const ogImg = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImg) result.thumbnail_url = ogImg[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

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
            // Extract release date from description (not year — we'll get that from video page)
            const dateMatch = rssInfo.description.match(/Released on:\s*(.+)/i)
              || rssInfo.description.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) result.release_date = dateMatch[1].trim();
          }
          break;
        }
      }

      // Sidebar description only (skip stats — they contain misleading "Last updated on" dates)
      const sidebar = ytData?.sidebar?.playlistSidebarRenderer?.items || [];
      for (const item of sidebar) {
        const primary = item?.playlistSidebarPrimaryInfoRenderer;
        if (primary) {
          const desc = primary?.description?.simpleText ||
            primary?.description?.runs?.map((r: any) => r.text).join('') || '';
          if (desc.length > 5 && (!result.description || desc.length > result.description.length)) {
            result.description = desc;
          }
          // DO NOT extract year from stats — "Last updated on..." is NOT the release date
        }
      }
    }

    // If we found a video_id but no description yet, try RSS
    if (result.video_id && !result.description) {
      const rssInfo = rssMap.get(result.video_id);
      if (rssInfo?.description) {
        result.description = rssInfo.description;
      }
    }

    // ── Get actual publish date from the first video page ──
    if (result.video_id) {
      const publishDate = await fetchVideoPublishDate(result.video_id);
      if (publishDate) {
        result.release_date = publishDate;
        result.sort_date = publishDate;
        const yearMatch = publishDate.match(/^(\d{4})/);
        if (yearMatch) result.year = yearMatch[1];
      }
    }

    // Fallback: extract year from RSS published date
    if (!result.year && result.video_id) {
      const rssInfo = rssMap.get(result.video_id);
      if (rssInfo?.published) {
        const pubYear = rssInfo.published.match(/(\d{4})/);
        if (pubYear) result.year = pubYear[1];
      }
    }

    // Fallback: extract year from description
    if (!result.year && result.description) {
      const ym = result.description.match(/\b(20\d{2})\b/);
      if (ym) result.year = ym[1];
    }

    // Compute sort_date if not set yet
    if (!result.sort_date) {
      result.sort_date = parseSortDate(result.release_date, result.year);
    }
  } catch (e) {
    console.error(`Error enriching ${release.title}:`, e);
  }

  return result;
}

// ── Parse sort_date from release_date text or year ────────────

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseSortDate(releaseDateText: string | null, year: string | null): string | null {
  if (releaseDateText) {
    // "Last updated on Feb 27, 2026" or "Feb 27, 2026"
    const m = releaseDateText.match(/(\w{3})\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) {
      const month = MONTH_MAP[m[1].toLowerCase()];
      if (month) return `${m[3]}-${month}-${m[2].padStart(2, '0')}`;
    }
    // "2025-03-15" ISO format
    const iso = releaseDateText.match(/(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
  }
  if (year) return `${year}-01-01`;
  return null;
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
        sort_order: release.sort_order,
        // Always overwrite date fields to fix previously incorrect data
        release_date: release.release_date,
        year: release.year,
        sort_date: release.sort_date,
      };
      if (release.thumbnail_url) updates.thumbnail_url = release.thumbnail_url;
      if (release.description && (!existing[0].description || release.description.length > (existing[0].description?.length || 0))) {
        updates.description = release.description;
      }
      if (release.video_id) updates.video_id = release.video_id;
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

// ── HyperFollow discovery & scraping (Firecrawl Map approach) ──

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

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheticals like "(Cola Ver)"
    .replace(/[^a-z0-9\u4e00-\u9fff\u3400-\u4dbf]+/g, '') // Keep alphanumeric + CJK chars
    .trim();
}

// Multi-tier matching: exact → startsWith → contains
function findMatchingRelease(normalizedPageTitle: string, titleMap: Map<string, any>): any | null {
  // Tier 1: Exact match
  if (titleMap.has(normalizedPageTitle)) return titleMap.get(normalizedPageTitle);

  // Tier 2: startsWith (either direction)
  for (const [normTitle, release] of titleMap) {
    if (normalizedPageTitle.startsWith(normTitle) || normTitle.startsWith(normalizedPageTitle)) {
      if (normTitle.length > 0 && normalizedPageTitle.length > 0) return release;
    }
  }

  // Tier 3: contains (either direction, but require minimum length to avoid false matches)
  for (const [normTitle, release] of titleMap) {
    if (normTitle.length < 2 && normalizedPageTitle.length < 2) continue; // Skip single-char unless exact
    if (normTitle.length >= 2 && normalizedPageTitle.includes(normTitle)) return release;
    if (normalizedPageTitle.length >= 2 && normTitle.includes(normalizedPageTitle)) return release;
  }

  return null;
}

function extractPageTitle(html: string): string | null {
  // Match <title>SONG by ARTIST</title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch) return null;
  const raw = titleMatch[1].trim();
  // Remove " by Artist" suffix
  const byMatch = raw.match(/^(.+?)\s+by\s+/i);
  return byMatch ? byMatch[1].trim() : raw;
}

async function discoverAndScrapeHyperFollow(supabaseUrl: string, serviceRoleKey: string): Promise<{ discovered: number; scraped: number }> {
  let discovered = 0, scraped = 0;

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.warn('FIRECRAWL_API_KEY not configured, skipping HyperFollow');
    return { discovered, scraped };
  }

  // Step 1: Use Firecrawl Map to discover all HyperFollow URLs
  console.log('Calling Firecrawl Map to discover all HyperFollow URLs...');
  const mapRes = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: 'https://distrokid.com/hyperfollow/colab2/',
      limit: 5000,
      includeSubdomains: false,
    }),
  });

  if (!mapRes.ok) {
    console.error(`Firecrawl Map failed: ${mapRes.status}`);
    return { discovered, scraped };
  }

  const mapData = await mapRes.json();
  const allUrls: string[] = mapData?.links || mapData?.data || [];
  
  // Filter to only colab2 HyperFollow URLs (exclude the base URL itself)
  const hyperfollowUrls = allUrls.filter((u: string) =>
    u.startsWith('https://distrokid.com/hyperfollow/colab2/') &&
    u !== 'https://distrokid.com/hyperfollow/colab2/' &&
    u !== 'https://distrokid.com/hyperfollow/colab2'
  );
  console.log(`Firecrawl Map found ${hyperfollowUrls.length} HyperFollow URLs`);
  // Log first 5 URLs for debugging
  for (const u of hyperfollowUrls.slice(0, 5)) {
    console.log(`  URL: ${u}`);
  }

  if (hyperfollowUrls.length === 0) return { discovered, scraped };

  // Step 2: Get all releases and existing streaming links
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

  // Build normalized title lookup: normalizedTitle -> release
  const titleMap = new Map<string, any>();
  for (const r of releases) {
    titleMap.set(normalizeTitle(r.title), r);
  }

  // Step 3: Scrape each URL in batches of 3
  for (let i = 0; i < hyperfollowUrls.length; i += 3) {
    const batch = hyperfollowUrls.slice(i, i + 3);
    const results = await Promise.all(batch.map(async (url: string) => {
      try {
        const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, formats: ['html'], waitFor: 5000 }),
        });
        if (!fcRes.ok) {
          console.warn(`Firecrawl scrape failed for ${url}: ${fcRes.status}`);
          return null;
        }
        const fcData = await fcRes.json();
        const html = fcData?.data?.html || fcData?.html || '';
        const pageTitle = extractPageTitle(html);
        const streamingLinks = extractStreamingLinks(html);
        console.log(`Scraped ${url}: title="${pageTitle}", links=${streamingLinks.length}, htmlLen=${html.length}`);
        return { url, pageTitle, streamingLinks };
      } catch (e) {
        console.warn(`Error scraping ${url}:`, e);
        return null;
      }
    }));

    for (const result of results) {
      if (!result) continue;
      if (!result.pageTitle) {
        console.log(`Skipping ${result.url}: no page title found`);
        continue;
      }
      if (result.streamingLinks.length === 0) {
        console.log(`Skipping ${result.url}: title="${result.pageTitle}" but 0 streaming links`);
        continue;
      }

      // Match page title to a release
      const normalizedPageTitle = normalizeTitle(result.pageTitle);
      const matchedRelease = findMatchingRelease(normalizedPageTitle, titleMap);

      if (!matchedRelease) {
        console.log(`No release match for page title "${result.pageTitle}" (normalized: "${normalizedPageTitle}")`);
        continue;
      }

      // Update hyperfollow_url if not set
      if (!matchedRelease.hyperfollow_url) {
        await fetch(`${supabaseUrl}/rest/v1/releases?id=eq.${matchedRelease.id}`, {
          method: 'PATCH',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ hyperfollow_url: result.url }),
        });
        discovered++;
        console.log(`Discovered HyperFollow for "${matchedRelease.title}": ${result.url}`);
      }

      // Skip if already has streaming links
      if (hasLinks.has(matchedRelease.id)) continue;

      // Upsert streaming links
      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/streaming_links`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(result.streamingLinks.map(l => ({
          release_id: matchedRelease.id, platform: l.platform, url: l.url,
        }))),
      });
      if (upsertRes.ok) {
        scraped++;
        hasLinks.add(matchedRelease.id); // Mark as done
        console.log(`Scraped ${result.streamingLinks.length} links for "${matchedRelease.title}"`);
      }
    }

    // Rate limit between batches
    if (i + 3 < hyperfollowUrls.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return { discovered, scraped };
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

    // HyperFollow-only mode: skip YouTube scraping, just discover & scrape streaming links
    if (hyperfollowOnly) {
      console.log('Running HyperFollow-only mode...');
      const { discovered, scraped } = await discoverAndScrapeHyperFollow(supabaseUrl, serviceRoleKey);
      const summary = { success: true, mode: 'hyperfollow_only', hyperfollow_discovered: discovered, streaming_links_scraped: scraped, timestamp: new Date().toISOString() };
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

    // Step 4: Skip HyperFollow in full sync (run separately to avoid timeout)
    // HyperFollow scraping should be triggered separately with { hyperfollow_only: true }

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
