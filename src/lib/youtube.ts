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
  VEVO: "UCCoEVSxdgOn_gcFI2jEFUEQ", // @ColaBVEVO — official music videos
  ARTIST: "@Cola_BB",
} as const;

export async function fetchYouTubeFeed(
  handleOrChannelId: string,
  maxResults?: number
): Promise<YouTubeVideo[]> {
  // If it starts with "UC", treat as channelId; otherwise as handle
  const isChannelId = handleOrChannelId.startsWith("UC");
  const body = isChannelId
    ? { channelId: handleOrChannelId, maxResults }
    : { handle: handleOrChannelId, maxResults };

  const { data, error } = await supabase.functions.invoke<YouTubeFeedResponse>(
    "fetch-youtube-feed",
    { body }
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
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Releases fetch error:", error);
    return [];
  }

  return (data as YouTubeRelease[]) || [];
}

export interface ReleaseTrack {
  id: string;
  release_id: string;
  video_id: string;
  title: string;
  track_number: number;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

export async function fetchReleaseTracks(releaseId: string): Promise<ReleaseTrack[]> {
  const { data, error } = await supabase
    .from("release_tracks")
    .select("*")
    .eq("release_id", releaseId)
    .order("track_number", { ascending: true });

  if (error) {
    console.error("Release tracks fetch error:", error);
    return [];
  }

  return (data as ReleaseTrack[]) || [];
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
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Releases fetch error:", error);
    return { releases: [], hasMore: false };
  }

  const releases = (data as YouTubeRelease[]) || [];
  return { releases, hasMore: releases.length === limit };
}
