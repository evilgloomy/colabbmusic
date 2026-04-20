
The site already has solid SEO foundations via `useSEO` and JSON-LD. Looking at what exists:

- `useSEO` hook ✅ (handles title, OG, Twitter, canonical, JSON-LD)
- `StoryDetailPage` already uses `useSEO` with Article JSON-LD ✅
- `sitemap.xml` is static — only lists top-level routes ❌
- Individual stories, releases, products NOT in sitemap ❌
- No prerendering — Google sees empty `<div id="root">` for dynamic pages ⚠️

The core gap: Google's crawler can render JS, but discovery is weak because dynamic detail pages (stories, releases, products) aren't listed anywhere crawlable. Also no dynamic sitemap.

## Plan: Expand SEO Coverage for Dynamic Pages

### 1. Dynamic sitemap via edge function
Create `supabase/functions/sitemap/index.ts` that returns XML listing:
- All static routes (home, music, store, story, etc.)
- Every story (`/story/:id`) from `stories` table
- Every release (`/music/:slug`) from releases table
- Every product (`/store/:handle`) from Shopify cache (or skip if not cached)

Served at `https://tfcrxvnfuagmqwkxoyei.supabase.co/functions/v1/sitemap` with `Content-Type: application/xml`.

### 2. Update `public/robots.txt`
Point `Sitemap:` directive to the edge function URL so crawlers discover it. Keep static `/sitemap.xml` as fallback for top-level routes.

### 3. Audit existing detail pages — add `useSEO` where missing
- `src/pages/ReleasePage.tsx` — verify it has Album JSON-LD; add if missing
- `src/pages/ProductDetail.tsx` — verify Product JSON-LD with price/availability; add if missing
- `src/pages/Videos.tsx`, `src/pages/Press.tsx`, `src/pages/AboutCola.tsx`, `src/pages/Story.tsx` (index) — confirm each has unique title + description

### 4. Strengthen `StoryDetailPage` SEO
Already has Article JSON-LD. Minor improvements:
- Add `articleSection` (category) and `keywords` to JSON-LD
- Add `og:article:published_time` and `article:author` meta tags (extend `useSEO` to accept `publishedTime` for `type: "article"`)

### 5. Add a Story index JSON-LD
On `/story` list page, emit `ItemList` schema linking all visible stories — helps Google discover detail pages even without sitemap fetch.

### Files to create/edit
- **Create**: `supabase/functions/sitemap/index.ts`
- **Edit**: `public/robots.txt`, `src/hooks/useSEO.ts` (add optional `publishedTime`), `src/pages/StoryDetail.tsx`, `src/pages/Story.tsx`, plus audit/fix `ReleasePage.tsx`, `ProductDetail.tsx`, `Videos.tsx`, `Press.tsx`, `AboutCola.tsx`

### Notes
- Edge function will be public (no JWT) and cache for 1 hour via `Cache-Control` header
- No DB schema changes needed
- Once deployed, submit the sitemap URL in Google Search Console for fastest indexing
