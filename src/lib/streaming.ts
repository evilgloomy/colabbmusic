import { supabase } from "@/integrations/supabase/client";

export interface StreamingLink {
  id: string;
  release_id: string;
  platform: string;
  url: string;
  created_at: string;
}

export async function fetchStreamingLinks(releaseId: string): Promise<StreamingLink[]> {
  const { data, error } = await supabase
    .from("streaming_links")
    .select("*")
    .eq("release_id", releaseId);

  if (error) {
    console.error("Streaming links fetch error:", error);
    return [];
  }

  return (data as StreamingLink[]) || [];
}

export async function fetchAllStreamingLinks(releaseIds: string[]): Promise<Record<string, StreamingLink[]>> {
  if (releaseIds.length === 0) return {};

  const { data, error } = await supabase
    .from("streaming_links")
    .select("*")
    .in("release_id", releaseIds);

  if (error) {
    console.error("Streaming links fetch error:", error);
    return {};
  }

  const grouped: Record<string, StreamingLink[]> = {};
  for (const link of (data as StreamingLink[]) || []) {
    if (!grouped[link.release_id]) grouped[link.release_id] = [];
    grouped[link.release_id].push(link);
  }
  return grouped;
}

export async function scrapeHyperFollow(hyperfollowUrl: string, releaseId: string) {
  const { data, error } = await supabase.functions.invoke("scrape-hyperfollow", {
    body: { hyperfollow_url: hyperfollowUrl, release_id: releaseId },
  });

  if (error) {
    console.error("Scrape error:", error);
    return { success: false, error: error.message };
  }

  return data;
}

// Platform display info
export const PLATFORM_INFO: Record<string, { label: string; icon: string; color: string }> = {
  spotify: {
    label: "Spotify",
    icon: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
    color: "#1DB954",
  },
  apple_music: {
    label: "Apple Music",
    icon: "M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.297.228.592.054 1.185.063 1.778.064h12.383a10.13 10.13 0 001.15-.063 5.825 5.825 0 001.597-.394c1.404-.6 2.378-1.62 2.907-3.06.177-.483.27-.985.335-1.492.073-.585.1-1.175.1-1.764V6.123h.004zm-6.77 5.04c-.003 2.09-.012 4.18.003 6.27a3.27 3.27 0 01-.247 1.312 2.61 2.61 0 01-1.395 1.4c-.39.164-.807.25-1.23.283-.67.056-1.34.028-1.975-.234a2.18 2.18 0 01-1.323-1.597 2.206 2.206 0 011.098-2.403c.404-.234.847-.375 1.3-.46.547-.1 1.1-.162 1.64-.28.367-.082.59-.323.652-.7.015-.072.022-.15.022-.224.002-1.81 0-3.62 0-5.43v-.18l-5.67 1.247v.066c.002 2.63 0 5.26.005 7.89 0 .31-.03.617-.112.916a2.557 2.557 0 01-1.17 1.6c-.44.27-.924.408-1.424.472-.527.068-1.057.05-1.57-.107a2.21 2.21 0 01-1.527-1.79 2.202 2.202 0 011.37-2.406c.357-.154.733-.27 1.11-.36.496-.114.997-.2 1.49-.322.416-.1.636-.396.67-.82.003-.034.004-.07.004-.103V7.27a1.1 1.1 0 01.852-1.09c.21-.06.42-.107.633-.15l4.233-.89c.695-.146 1.39-.29 2.086-.437.192-.04.386-.07.58-.088.345-.03.594.17.623.52.004.042.004.085.004.127v5.95l-.006-.006z",
    color: "#FA233B",
  },
  itunes: {
    label: "iTunes",
    icon: "M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.297.228.592.054 1.185.063 1.778.064h12.383a10.13 10.13 0 001.15-.063 5.825 5.825 0 001.597-.394c1.404-.6 2.378-1.62 2.907-3.06.177-.483.27-.985.335-1.492.073-.585.1-1.175.1-1.764V6.123h.004z",
    color: "#EA4CC0",
  },
  deezer: {
    label: "Deezer",
    icon: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z",
    color: "#FEAA2D",
  },
  youtube_music: {
    label: "YouTube Music",
    icon: "M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228 18.228 15.432 18.228 12 15.432 5.772 12 5.772zM9.684 15.54V8.46L16.2 12l-6.516 3.54z",
    color: "#FF0000",
  },
};
