const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface YouTubeVideo {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  embedUrl: string;
  channelName: string;
}

interface YouTubeRelease {
  title: string;
  year: string;
  thumbnail: string;
  videoId?: string;
  playlistId?: string;
  trackCount?: number;
}

async function resolveChannelId(handle: string): Promise<string> {
  const url = `https://www.youtube.com/${handle}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube channel page: ${response.status}`);
  }

  const html = await response.text();

  const patterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /channel_id=(UC[a-zA-Z0-9_-]{22})/,
    /<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/,
    /\"externalId\":\"(UC[a-zA-Z0-9_-]{22})\"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Could not resolve channel ID for handle: ${handle}`);
}

function parseRssFeed(xml: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const entries = xml.split('<entry>').slice(1);

  for (const entry of entries) {
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<media:title>([^<]+)<\/media:title>/) || entry.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const thumbnailMatch = entry.match(/<media:thumbnail url="([^"]+)"/);
    const channelMatch = entry.match(/<name>([^<]+)<\/name>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1];
      videos.push({
        videoId,
        title: titleMatch[1],
        published: publishedMatch?.[1] || '',
        thumbnail: thumbnailMatch?.[1] || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        channelName: channelMatch?.[1] || '',
      });
    }
  }

  return videos;
}

async function fetchReleasesPage(handle: string): Promise<YouTubeRelease[]> {
  const handleStr = handle.startsWith('@') ? handle : `@${handle}`;
  const url = `https://www.youtube.com/${handleStr}/releases`;

  console.log('Fetching releases page:', url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch releases page: ${response.status}`);
  }

  const html = await response.text();

  // Try to extract ytInitialData from the page source
  const ytInitialDataMatch = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
  if (!ytInitialDataMatch) {
    console.log('ytInitialData not found, trying alternative patterns...');

    // Try alternative pattern
    const altMatch = html.match(/ytInitialData\s*=\s*'([^']+)'/);
    if (altMatch) {
      try {
        const decoded = JSON.parse(altMatch[1].replace(/\\x([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
        return extractReleasesFromInitialData(decoded);
      } catch (e) {
        console.error('Failed to parse alt ytInitialData:', e);
      }
    }

    // Try yet another pattern - the data might be embedded differently
    const jsonMatch = html.match(/ytInitialData["\s]*[=:]\s*({[\s\S]*?});\s*(?:window\[|var )/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        return extractReleasesFromInitialData(data);
      } catch (e) {
        console.error('Failed to parse json ytInitialData:', e);
      }
    }

    // Log a snippet for debugging
    const idx = html.indexOf('ytInitialData');
    if (idx !== -1) {
      console.log('Found ytInitialData at index', idx, 'snippet:', html.substring(idx, idx + 200));
    } else {
      console.log('No ytInitialData found in HTML at all. HTML length:', html.length);
      // Log first 500 chars to see what we got
      console.log('HTML start:', html.substring(0, 500));
    }

    return [];
  }

  try {
    const data = JSON.parse(ytInitialDataMatch[1]);
    return extractReleasesFromInitialData(data);
  } catch (e) {
    console.error('Failed to parse ytInitialData JSON:', e);
    return [];
  }
}

function extractReleasesFromInitialData(data: any): YouTubeRelease[] {
  const releases: YouTubeRelease[] = [];

  try {
    // Navigate through YouTube's data structure to find releases/shelf content
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

    for (const tab of tabs) {
      const tabRenderer = tab?.tabRenderer;
      if (!tabRenderer?.content) continue;

      const sectionListRenderer = tabRenderer.content?.richGridRenderer ||
        tabRenderer.content?.sectionListRenderer;

      if (!sectionListRenderer) continue;

      // Try richGridRenderer (newer layout)
      const items = sectionListRenderer?.contents || [];
      for (const item of items) {
        const richItem = item?.richItemRenderer?.content;
        const shelfRenderer = item?.richShelfRenderer;

        if (richItem?.playlistRenderer) {
          const pl = richItem.playlistRenderer;
          releases.push({
            title: pl.title?.simpleText || pl.title?.runs?.[0]?.text || 'Unknown',
            year: pl.publishedTimeText?.simpleText || '',
            thumbnail: getBestThumbnail(pl.thumbnails || pl.thumbnail?.thumbnails),
            playlistId: pl.playlistId,
            trackCount: pl.videoCount ? parseInt(pl.videoCount) : undefined,
          });
        }

        if (richItem?.videoRenderer) {
          const vr = richItem.videoRenderer;
          releases.push({
            title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Unknown',
            year: vr.publishedTimeText?.simpleText || '',
            thumbnail: getBestThumbnail(vr.thumbnail?.thumbnails),
            videoId: vr.videoId,
          });
        }

        // Handle shelf renderers (grouped releases)
        if (shelfRenderer) {
          const shelfItems = shelfRenderer.contents || [];
          for (const si of shelfItems) {
            const renderer = si?.richItemRenderer?.content;
            if (renderer?.playlistRenderer) {
              const pl = renderer.playlistRenderer;
              releases.push({
                title: pl.title?.simpleText || pl.title?.runs?.[0]?.text || 'Unknown',
                year: pl.publishedTimeText?.simpleText || '',
                thumbnail: getBestThumbnail(pl.thumbnails || pl.thumbnail?.thumbnails),
                playlistId: pl.playlistId,
                trackCount: pl.videoCount ? parseInt(pl.videoCount) : undefined,
              });
            }
          }
        }
      }

      // Try sectionListRenderer (older layout)
      const sections = sectionListRenderer?.contents || [];
      for (const section of sections) {
        const shelf = section?.itemSectionRenderer?.contents?.[0]?.shelfRenderer;
        if (!shelf) continue;

        const gridItems = shelf.content?.horizontalListRenderer?.items ||
          shelf.content?.expandedShelfContentsRenderer?.items || [];

        for (const gridItem of gridItems) {
          const musicItem = gridItem?.gridPlaylistRenderer || gridItem?.gridVideoRenderer;
          if (musicItem) {
            releases.push({
              title: musicItem.title?.runs?.[0]?.text || musicItem.title?.simpleText || 'Unknown',
              year: musicItem.publishedTimeText?.simpleText || '',
              thumbnail: getBestThumbnail(musicItem.thumbnail?.thumbnails || musicItem.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails),
              videoId: musicItem.videoId,
              playlistId: musicItem.playlistId,
            });
          }
        }
      }
    }

    console.log(`Extracted ${releases.length} releases from ytInitialData`);
  } catch (e) {
    console.error('Error extracting releases:', e);
  }

  return releases;
}

function getBestThumbnail(thumbnails: any[] | undefined): string {
  if (!thumbnails || !Array.isArray(thumbnails)) return '';
  // Get the highest resolution thumbnail
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { handle, channelId, maxResults, mode } = await req.json();

    if (!handle && !channelId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either handle or channelId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode: "releases" fetches the /releases page, "videos" (default) fetches the RSS feed
    if (mode === 'releases') {
      const handleStr = handle || '';
      const releases = await fetchReleasesPage(handleStr);
      return new Response(
        JSON.stringify({ success: true, releases }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: RSS feed mode
    let resolvedChannelId = channelId;
    if (!resolvedChannelId && handle) {
      const handleStr = handle.startsWith('@') ? handle : `@${handle}`;
      resolvedChannelId = await resolveChannelId(handleStr);
    }

    console.log('Fetching RSS feed for channel:', resolvedChannelId);

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${resolvedChannelId}`;
    
    // Retry up to 3 times since YouTube RSS can be flaky
    let rssResponse: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      rssResponse = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/xml, text/xml, */*',
        },
      });
      if (rssResponse.ok) break;
      console.log(`RSS feed attempt ${attempt + 1} returned ${rssResponse.status}, retrying...`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }

    if (!rssResponse || !rssResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `RSS feed returned ${rssResponse?.status ?? 'unknown'}` }),
        { status: rssResponse?.status ?? 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xml = await rssResponse.text();
    let videos = parseRssFeed(xml);

    if (maxResults && maxResults > 0) {
      videos = videos.slice(0, maxResults);
    }

    return new Response(
      JSON.stringify({ success: true, channelId: resolvedChannelId, videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch YouTube data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
