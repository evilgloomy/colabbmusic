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
  id: string;
  title: string;
  playlist_id: string | null;
  video_id: string | null;
  thumbnail_url: string | null;
  description: string | null;
  release_date: string | null;
  track_count: number | null;
  year: string | null;
  created_at: string;
  updated_at: string;
}

interface YouTubeFeedResponse {
  success: boolean;
  channelId?: string;
  videos?: YouTubeVideo[];
  error?: string;
}

// Cola B's YouTube channels
export const CHANNELS = {
  VEVO: "@ColaBVEVO",
  ARTIST: "@Cola_BB",
} as const;

export async function fetchYouTubeFeed(
  handle: string,
  maxResults?: number
): Promise<YouTubeVideo[]> {
  const { data, error } = await supabase.functions.invoke<YouTubeFeedResponse>(
    "fetch-youtube-feed",
    { body: { handle, maxResults } }
  );

  if (error || !data?.success || !data.videos) {
    console.error("YouTube feed error:", error || data?.error);
    return [];
  }

  return data.videos;
}

export async function fetchReleases(): Promise<YouTubeRelease[]> {
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .order("year", { ascending: false, nullsFirst: false })
    .order("release_date", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Releases fetch error:", error);
    return [];
  }

  return (data as YouTubeRelease[]) || [];
}
