import { supabase } from "@/integrations/supabase/client";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  embedUrl: string;
  channelName: string;
}

export interface YouTubeRelease {
  title: string;
  year: string;
  thumbnail: string;
  videoId?: string;
  playlistId?: string;
  trackCount?: number;
}

interface YouTubeFeedResponse {
  success: boolean;
  channelId?: string;
  videos?: YouTubeVideo[];
  releases?: YouTubeRelease[];
  error?: string;
}

// Cola B's YouTube channels
export const CHANNELS = {
  VEVO: "@ColaBVEVO",       // Music videos
  ARTIST: "@Cola_BB",       // Full discography / releases
} as const;

export async function fetchYouTubeFeed(
  handle: string,
  maxResults?: number
): Promise<YouTubeVideo[]> {
  const { data, error } = await supabase.functions.invoke<YouTubeFeedResponse>(
    "fetch-youtube-feed",
    {
      body: { handle, maxResults },
    }
  );

  if (error) {
    console.error("YouTube feed error:", error);
    return [];
  }

  if (!data?.success || !data.videos) {
    console.error("YouTube feed failed:", data?.error);
    return [];
  }

  return data.videos;
}

export async function fetchYouTubeReleases(
  handle: string
): Promise<YouTubeRelease[]> {
  const { data, error } = await supabase.functions.invoke<YouTubeFeedResponse>(
    "fetch-youtube-feed",
    {
      body: { handle, mode: "releases" },
    }
  );

  if (error) {
    console.error("YouTube releases error:", error);
    return [];
  }

  if (!data?.success || !data.releases) {
    console.error("YouTube releases failed:", data?.error);
    return [];
  }

  return data.releases;
}
