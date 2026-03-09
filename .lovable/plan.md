

# Plan: Backend CMS + Music/Video Data Fetching + Store Link-Out

## Three Changes

### 1. Store Page → Link to Shopify Storefront

Replace the current custom store page with a redirect to the existing Shopify storefront. When users click "Store" in the nav, it opens `909d73.myshopify.com` in a new tab. Remove the `/store` route, the `CartDrawer`, cart store, and cart sync hook since commerce lives entirely on Shopify.

**Files to modify:**
- `src/components/layout/Navbar.tsx` — Change Store nav item from `<Link>` to `<a href>` with `target="_blank"` pointing to the Shopify store URL
- `src/App.tsx` — Remove `/store` and `/product/:handle` routes, remove `useCartSync`
- Delete or leave unused: `src/pages/Store.tsx`, `src/pages/ProductDetail.tsx`, `src/components/CartDrawer.tsx`, `src/components/ProductCard.tsx`, `src/components/ProductGrid.tsx`, `src/stores/cartStore.ts`, `src/hooks/useCartSync.ts`
- `src/components/home/StoryPreview.tsx` — Update "Visit the Store" CTA to link externally

### 2. Music & Videos: Fetch from YouTube via RSS + oEmbed

YouTube provides a **free public RSS feed** per channel at `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`. This returns the latest 15 videos with titles, thumbnails, publish dates, and video IDs — no API key needed.

For the music page, we can also use YouTube's **oEmbed endpoint** (`https://www.youtube.com/oembed?format=json&url=...`) to get video metadata without an API key.

**Approach:**
- Create an edge function `supabase/functions/fetch-youtube-feed/index.ts` that fetches the RSS XML, parses it, and returns JSON with video titles, IDs, thumbnails, and dates
- Need the user's channel ID (they'll provide the URL next)
- For the **Videos page**: fetch from the colabvevo channel, filter for music videos
- For the **Music page**: We still need release metadata (album art, streaming links) that YouTube doesn't provide. Two options:
  - Keep the static `content.ts` for release metadata (album art, Spotify/Apple links, genre, synopsis) but enrich with real YouTube video embeds
  - Or scrape from another source

**Since the user mentioned Cola B's music is on all platforms**, the most reliable free approach:
- **YouTube RSS** for video data (titles, thumbnails, embeds) — powers Videos page and video embeds on Music page
- **Static content.ts** (or later Supabase CMS) for release metadata (cover art, streaming links, synopsis) — since there's no free API for Spotify/Apple Music metadata without keys

**Files to create:**
- `supabase/functions/fetch-youtube-feed/index.ts` — Fetches and parses YouTube RSS feed
- `src/lib/youtube.ts` — Client-side helper to call the edge function

**Files to modify:**
- `src/pages/Videos.tsx` — Fetch real videos from YouTube instead of static data
- `src/pages/Music.tsx` — Embed real YouTube videos where relevant
- `src/components/home/FeaturedVideo.tsx` — Use real video from YouTube feed

### 3. Admin CMS Backend (Studio Assembly)

Build an admin dashboard using Lovable Cloud (Supabase) to manage:
- **Releases** — title, cover art URL, streaming links, synopsis, active campaign flag
- **Story entries** — title, date, category, image, caption
- **Videos** — managed via YouTube feed (auto-fetched), but can pin/feature specific ones
- **Press assets** — bios, images, press kit
- **Brand settings** — positioning statement, bios

**This requires enabling Lovable Cloud first.** The admin panel would be a protected `/admin` route with forms to CRUD content, replacing the static `content.ts`.

**Since Lovable Cloud isn't connected yet**, I'll note this as a dependency. We can:
- Build the admin UI structure now with the static data
- Wire it to Supabase once Cloud is enabled

---

## Implementation Order

1. **Store link-out** — Simplest change, clean up cart/store code
2. **YouTube feed edge function** — Requires Lovable Cloud for the edge function (to avoid CORS issues with YouTube RSS). Will need Cloud enabled first.
3. **Update Videos + Music pages** — Wire to real YouTube data
4. **Admin CMS** — Requires Lovable Cloud for database tables

**Dependency: Steps 2-4 require enabling Lovable Cloud.** Step 1 can be done immediately.

## Questions Before Proceeding

- I'll need the Cola B YouTube channel URL/ID to set up the RSS feed
- Lovable Cloud needs to be enabled for the edge function (YouTube RSS proxy) and admin CMS database

