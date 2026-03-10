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
  sort_date: string | null;
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
  VEVO: "@Cola_BB",
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
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Releases fetch error:", error);
    return [];
  }

  return (data as YouTubeRelease[]) || [];
}

const PAGE_SIZE = 30;

export async function fetchReleasesPaginated(
  offset: number,
  limit: number = PAGE_SIZE
): Promise<{ releases: YouTubeRelease[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Releases fetch error:", error);
    return { releases: [], hasMore: false };
  }

  const releases = (data as YouTubeRelease[]) || [];
  return { releases, hasMore: releases.length === limit };
}
