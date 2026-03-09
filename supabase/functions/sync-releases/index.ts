const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// ---------- Step 1: Scrape /releases page for playlist IDs ----------

async function fetchReleasesPage(handle: string): Promise<ScrapedRelease[]> {
  const url = `https://www.youtube.com/${handle}/releases`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch releases page: ${res.status}`);
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
      // Also check shelf renderers
      const shelf = item?.richShelfRenderer?.contents || [];
      for (const si of shelf) {
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

// ---------- Step 2: Enrich each release with artwork + description ----------

async function enrichRelease(release: ScrapedRelease): Promise<EnrichedRelease> {
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
    // Fetch playlist page to get artwork + first video ID + description
    const playlistUrl = `https://www.youtube.com/playlist?list=${release.playlistId}`;
    const res = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      console.warn(`Failed to fetch playlist ${release.playlistId}: ${res.status}`);
      return result;
    }

    const html = await res.text();

    // Extract og:image for artwork
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
      result.thumbnail_url = ogImageMatch[1];
    }

    // Extract og:description
    const ogDescMatch = html.match(/<meta property="og:description" content="([^"]*)"/)
      || html.match(/<meta name="description" content="([^"]*)"/);
    if (ogDescMatch) {
      result.description = decodeHtmlEntities(ogDescMatch[1]);
    }

    // Try to extract ytInitialData for more details
    const ytMatch = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
    if (ytMatch) {
      try {
        const ytData = JSON.parse(ytMatch[1]);

        // Get first video ID from playlist
        const playlistVideos = findPlaylistVideos(ytData);
        if (playlistVideos.length > 0) {
          result.video_id = playlistVideos[0].videoId;

          // Try to get description from first video's metadata
          const firstVideoDesc = playlistVideos[0].description;
          if (firstVideoDesc && (!result.description || result.description.length < firstVideoDesc.length)) {
            result.description = firstVideoDesc;
          }
        }

        // Try to find the playlist description / release date from sidebar
        const sidebar = ytData?.sidebar?.playlistSidebarRenderer?.items || [];
        for (const item of sidebar) {
          const primary = item?.playlistSidebarPrimaryInfoRenderer;
          if (primary) {
            // Description
            const desc = primary?.description?.simpleText ||
              primary?.description?.runs?.map((r: any) => r.text).join('') || '';
            if (desc && (!result.description || desc.length > result.description.length)) {
              result.description = desc;
            }

            // Stats (may contain date)
            const stats = primary?.stats || [];
            for (const stat of stats) {
              const text = stat?.simpleText || stat?.runs?.map((r: any) => r.text).join('') || '';
              // Look for year patterns
              const yearMatch = text.match(/\b(20\d{2})\b/);
              if (yearMatch) {
                result.year = yearMatch[1];
                result.release_date = text;
              }
            }
          }
        }

        // Also check header for year
        const header = ytData?.header?.playlistHeaderRenderer;
        if (header) {
          const subtitle = header?.subtitle?.simpleText || header?.subtitle?.runs?.map((r: any) => r.text).join('') || '';
          const yearMatch = subtitle.match(/\b(20\d{2})\b/);
          if (yearMatch && !result.year) {
            result.year = yearMatch[1];
          }

          // byline may have date
          const byline = header?.byline?.runs?.map((r: any) => r.text).join('') || '';
          const bylineYear = byline.match(/\b(20\d{2})\b/);
          if (bylineYear && !result.year) {
            result.year = bylineYear[1];
          }
        }
      } catch (e) {
        console.warn(`Failed to parse ytInitialData for playlist ${release.playlistId}:`, e);
      }
    }

    // Always try to fetch the first video's description if we have a video_id
    if (result.video_id && (!result.description || result.description.length < 20)) {
      try {
        const videoDesc = await fetchVideoDescription(result.video_id);
        if (videoDesc) {
          result.description = videoDesc;
        }
      } catch (e) {
        console.warn(`Failed to fetch video description for ${result.video_id}:`, e);
      }
    }

    // If no video_id yet but we have a playlist, try fetching the playlist page for the first video
    if (!result.video_id && result.playlist_id) {
      try {
        const firstVideoId = await fetchFirstVideoFromPlaylist(result.playlist_id);
        if (firstVideoId) {
          result.video_id = firstVideoId;
          const videoDesc = await fetchVideoDescription(firstVideoId);
          if (videoDesc) result.description = videoDesc;
        }
      } catch (e) {
        console.warn(`Failed to fetch first video for playlist ${result.playlist_id}:`, e);
      }
    }

    // Extract year from description if we don't have it yet
    if (!result.year && result.description) {
      const descYear = result.description.match(/\b(20\d{2})\b/);
      if (descYear) {
        result.year = descYear[1];
      }
    }
  } catch (e) {
    console.error(`Error enriching release ${release.title}:`, e);
  }

  return result;
}

function findPlaylistVideos(ytData: any): Array<{ videoId: string; description?: string }> {
  const videos: Array<{ videoId: string; description?: string }> = [];

  try {
    const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];

    for (const item of contents) {
      const vr = item?.playlistVideoRenderer;
      if (vr?.videoId) {
        const desc = vr?.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '';
        videos.push({ videoId: vr.videoId, description: desc || undefined });
      }
    }
  } catch (e) {
    // Ignore
  }

  return videos;
}

async function fetchFirstVideoFromPlaylist(playlistId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Look for first videoId in the playlist
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function fetchVideoDescription(videoId: string): Promise<string | null> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) return null;
  const html = await res.text();

  // Try ytInitialData for full description
  const ytMatch = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
  if (ytMatch) {
    try {
      const data = JSON.parse(ytMatch[1]);
      // Navigate to video description in engagement panels or two column watch
      const panels = data?.engagementPanels || [];
      for (const panel of panels) {
        const content = panel?.engagementPanelSectionListRenderer?.content?.structuredDescriptionContentRenderer?.items || [];
        for (const item of content) {
          const descRuns = item?.videoDescriptionHeaderRenderer?.title?.runs ||
            item?.expandableVideoDescriptionBodyRenderer?.descriptionBodyText?.runs;
          if (descRuns) {
            const desc = descRuns.map((r: any) => r.text).join('');
            if (desc.length > 10) return desc;
          }
        }
      }

      // Try alternative path
      const videoDetails = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
      if (videoDetails) {
        for (const c of videoDetails) {
          const desc = c?.videoSecondaryInfoRenderer?.description?.runs;
          if (desc) {
            return desc.map((r: any) => r.text).join('');
          }
          const attrDesc = c?.videoSecondaryInfoRenderer?.attributedDescription?.content;
          if (attrDesc) return attrDesc;
        }
      }
    } catch (e) {
      console.warn(`Failed to parse ytInitialData for video ${videoId}:`, e);
    }
  }

  // Fallback: og:description
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/);
  if (ogDesc) {
    return decodeHtmlEntities(ogDesc[1]);
  }

  return null;
}

  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ---------- Step 3: Upsert to database ----------

async function upsertReleases(releases: EnrichedRelease[]): Promise<{ inserted: number; updated: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  let inserted = 0;
  let updated = 0;

  for (const release of releases) {
    // Check if exists
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/releases?playlist_id=eq.${encodeURIComponent(release.playlist_id)}&select=id,thumbnail_url,description`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const existing = await checkRes.json();

    if (existing.length > 0) {
      // Update only if we have new data
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      let hasChanges = false;

      if (release.thumbnail_url && !existing[0].thumbnail_url) {
        updates.thumbnail_url = release.thumbnail_url;
        hasChanges = true;
      }
      if (release.description && (!existing[0].description || release.description.length > existing[0].description.length)) {
        updates.description = release.description;
        hasChanges = true;
      }
      // Always update these fields
      if (release.video_id) updates.video_id = release.video_id;
      if (release.release_date) updates.release_date = release.release_date;
      if (release.year) updates.year = release.year;
      if (release.track_count) updates.track_count = release.track_count;
      updates.title = release.title;

      if (hasChanges || release.video_id || release.year) {
        await fetch(
          `${supabaseUrl}/rest/v1/releases?playlist_id=eq.${encodeURIComponent(release.playlist_id)}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(updates),
          }
        );
        updated++;
      }
    } else {
      // Insert new release
      await fetch(
        `${supabaseUrl}/rest/v1/releases`,
        {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            ...release,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        }
      );
      inserted++;
    }
  }

  return { inserted, updated };
}

// ---------- Step 4: Batch processing with rate limiting ----------

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const handle = '@Cola_BB';
    console.log(`Starting release sync for ${handle}...`);

    // Step 1: Get all playlist IDs from /releases page
    const scrapedReleases = await fetchReleasesPage(handle);
    console.log(`Found ${scrapedReleases.length} releases to process`);

    if (scrapedReleases.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No releases found on page', inserted: 0, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Enrich each release (batch of 3 with 1s delay to avoid rate limiting)
    console.log('Enriching releases with artwork and descriptions...');
    const enrichedReleases = await processInBatches(scrapedReleases, 3, 1000, enrichRelease);

    const withThumbnails = enrichedReleases.filter(r => r.thumbnail_url).length;
    const withDescriptions = enrichedReleases.filter(r => r.description).length;
    const withYears = enrichedReleases.filter(r => r.year).length;
    console.log(`Enriched: ${withThumbnails} thumbnails, ${withDescriptions} descriptions, ${withYears} years`);

    // Step 3: Upsert to database
    console.log('Upserting to database...');
    const { inserted, updated } = await upsertReleases(enrichedReleases);

    const summary = {
      success: true,
      total: scrapedReleases.length,
      inserted,
      updated,
      withThumbnails,
      withDescriptions,
      withYears,
      timestamp: new Date().toISOString(),
    };

    console.log('Sync complete:', JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
