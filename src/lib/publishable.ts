/**
 * Content safety guards.
 *
 * Records that are missing the pieces required to render a credible editorial
 * card (artwork, title, date, links) are filtered out at the render boundary
 * instead of being shown as placeholders. Sections that end up empty hide
 * themselves rather than printing "coming soon".
 */

const isDev = import.meta.env.DEV;

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export interface ReleaseLike {
  id?: string;
  title?: string | null;
  thumbnail_url?: string | null;
  release_date?: string | null;
  sort_date?: string | null;
  year?: string | null;
  video_id?: string | null;
  playlist_id?: string | null;
}

export const isPublishableRelease = (r: ReleaseLike | null | undefined): boolean => {
  if (!r) return false;
  if (!nonEmpty(r.title)) return false;
  if (!nonEmpty(r.thumbnail_url)) return false;
  if (!nonEmpty(r.release_date) && !nonEmpty(r.sort_date) && !nonEmpty(r.year)) return false;
  if (!nonEmpty(r.video_id) && !nonEmpty(r.playlist_id)) return false;
  return true;
};

export interface VideoLike {
  videoId?: string;
  title?: string | null;
  thumbnail?: string | null;
}

export const isPublishableVideo = (v: VideoLike | null | undefined): boolean =>
  !!v && nonEmpty(v.videoId) && nonEmpty(v.title) && nonEmpty(v.thumbnail);

export interface StoryLike {
  id?: string;
  ai_title?: string | null;
  ai_enhanced_text?: string | null;
  media_url?: string | null;
  posted_at?: string | null;
}

export const isPublishableStory = (s: StoryLike | null | undefined): boolean => {
  if (!s) return false;
  if (!nonEmpty(s.ai_title)) return false;
  if (!nonEmpty(s.posted_at)) return false;
  return nonEmpty(s.media_url) || nonEmpty(s.ai_enhanced_text);
};

export interface ProductLike {
  node?: {
    title?: string | null;
    handle?: string | null;
    availableForSale?: boolean;
    images?: { edges?: Array<{ node?: { url?: string | null } }> };
    priceRange?: { minVariantPrice?: { amount?: string | null } };
    variants?: { edges?: Array<unknown> };
  };
}

export const isPublishableProduct = (p: ProductLike | null | undefined): boolean => {
  const n = p?.node;
  if (!n) return false;
  if (!nonEmpty(n.title) || !nonEmpty(n.handle)) return false;
  if (!nonEmpty(n.images?.edges?.[0]?.node?.url)) return false;
  const amount = n.priceRange?.minVariantPrice?.amount;
  if (!nonEmpty(amount) || Number(amount) <= 0) return false;
  if (!n.variants?.edges?.length) return false;
  return true;
};

/**
 * Filter a list with a guard and, in development only, report what was hidden
 * so data gaps are visible to owners without ever leaking to visitors.
 */
export function publishableOnly<T>(
  items: readonly T[] | null | undefined,
  guard: (item: NoInfer<T>) => boolean,
  label: string,
): T[] {
  const list = items ?? [];
  const kept = list.filter(guard);
  if (isDev && kept.length !== list.length) {
    // eslint-disable-next-line no-console
    console.info(
      `[content guard] ${label}: hid ${list.length - kept.length} of ${list.length} incomplete record(s)`,
      list.filter((i) => !guard(i)),
    );
  }
  return kept;
}
