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

async function resolveChannelId(handle: string): Promise<string> {
  // Fetch the YouTube channel page and extract channel ID from HTML
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

  // Extract channel ID from multiple possible patterns
  const patterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /channel_id=(UC[a-zA-Z0-9_-]{22})/,
    /<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/,
    /\"externalId\":\"(UC[a-zA-Z0-9_-]{22})\"/,
    /data-channel-external-id="(UC[a-zA-Z0-9_-]{22})"/,
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

  // Split by <entry> tags
  const entries = xml.split('<entry>').slice(1); // skip the first part (feed metadata)

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { handle, channelId, maxResults } = await req.json();

    if (!handle && !channelId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either handle or channelId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve handle to channel ID if needed
    let resolvedChannelId = channelId;
    if (!resolvedChannelId && handle) {
      const handleStr = handle.startsWith('@') ? handle : `@${handle}`;
      resolvedChannelId = await resolveChannelId(handleStr);
    }

    console.log('Fetching RSS feed for channel:', resolvedChannelId);

    // Fetch the RSS feed
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${resolvedChannelId}`;
    const rssResponse = await fetch(rssUrl);

    if (!rssResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `RSS feed returned ${rssResponse.status}` }),
        { status: rssResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xml = await rssResponse.text();
    let videos = parseRssFeed(xml);

    // Limit results if requested
    if (maxResults && maxResults > 0) {
      videos = videos.slice(0, maxResults);
    }

    return new Response(
      JSON.stringify({
        success: true,
        channelId: resolvedChannelId,
        videos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching YouTube feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch YouTube feed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
