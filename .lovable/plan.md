# EPIC 2 — SEO Depth (Tickets 201, 202, 203)

## TICKET-201 — JSON-LD structured data

Several pages already inject `jsonLd` via `useSEO`, but the implementation is ad-hoc and missing on key surfaces. We'll standardize and extend.

**New helper**: `src/components/seo/JsonLd.tsx`
- Tiny component: `<JsonLd data={obj} />` renders a `<script type="application/ld+json">` and supports an array of graphs (so a page can emit Product + BreadcrumbList together).
- Also export `buildBreadcrumb(items: { name; url }[])` helper.

**Hook update**: `src/hooks/useSEO.ts`
- Change `jsonLd` option to accept `Record<string, unknown> | Record<string, unknown>[]` so callers can attach BreadcrumbList alongside the page's primary entity.

**Per-page graphs**:
- `src/pages/Index.tsx` (currently has none): emit `MusicGroup` with `name: "Cola B"`, `image: og-image`, `url: SITE_URL`, `sameAs: [Spotify artist, Apple Music artist, YouTube @Cola_BB, Instagram, Facebook, TikTok, Threads, SoundCloud]` (URLs sourced from `mem://brand/official-presence`). Add WebSite graph with `potentialAction` SearchAction. No breadcrumb on home.
- `src/pages/ReleasePage.tsx` (already has MusicAlbum/MusicRecording): enrich with `track` array built from `tracks` state (each `MusicRecording` with `name` + `duration` ISO 8601), add `inAlbum` for singles, add BreadcrumbList Home › Music › {title}.
- `src/pages/ProductDetail.tsx` (already has Product/Offer): add `brand: { "@type": "Brand", name: "Cola B" }`, dynamic `availability` from `selectedVariant.availableForSale`, `sku: selectedVariant.id`, `itemCondition: NewCondition`. Add BreadcrumbList Home › Store › {title}.
- `src/pages/StoryDetail.tsx` (already has Article): add BreadcrumbList Home › Story › {title}.
- Optionally also inject BreadcrumbList on `Music`, `Store`, `Story`, `Videos`, `Press` index pages.

## TICKET-202 — Dynamic sitemap

An edge function `supabase/functions/sitemap/index.ts` already exists and emits static routes + stories + releases. Gaps: no Shopify products, robots.txt lists two sitemaps, static `public/sitemap.xml` is stale and wins on the apex domain.

**Changes**:
- `supabase/functions/sitemap/index.ts`: add Shopify Storefront API fetch (paginated `products(first: 250)` with `handle` + `updatedAt`) using `SHOPIFY_STOREFRONT_ACCESS_TOKEN` and `shopify--get_shop_permanent_domain` value (hardcode the resolved `*.myshopify.com` domain as a constant — Storefront token is already in secrets). Emit `/product/:handle` URLs with `lastmod`. Add `/privacy`, `/terms` to STATIC_ROUTES. Skip `/lovevibevol5` (noindex).
- `public/sitemap.xml`: delete (stale, missing dynamic content). Lovable/Vite will then 404 on `/sitemap.xml` at the apex — so we need a redirect.
- `public/_redirects` (new, Lovable-supported): add `/sitemap.xml https://tfcrxvnfuagmqwkxoyei.supabase.co/functions/v1/sitemap 200` so the canonical sitemap URL proxies the edge function.
- `public/robots.txt`: collapse to a single `Sitemap: https://colabbmusic.com/sitemap.xml` line (drop the supabase URL).

**Acceptance**: `curl https://colabbmusic.com/sitemap.xml` returns XML with every release, story, and Shopify product.

## TICKET-203 — Per-page SEO consistency sweep

**Title pattern**: standardize on `"{Page} | Cola B — Queen of Emo Pop"` (home is `"Cola B — Queen of Emo Pop | Official Site"`).
- `index.html` line 7: update default `<title>`.
- `src/hooks/useSEO.ts`: change `DEFAULT_TITLE` and add internal helper that, when caller passes a bare page title, formats as `{title} | Cola B — Queen of Emo Pop`. Keep an `exactTitle?: boolean` escape hatch.
- Audit every page in `src/pages/` and ensure `useSEO({ title, description, image })` is called with all three. Files needing additions/updates: `Music.tsx`, `Videos.tsx`, `Store.tsx`, `Story.tsx`, `Press.tsx`, `AboutCola.tsx`, `ChatPage.tsx`, `Policies.tsx`, `Privacy.tsx`, `Terms.tsx`, `NotFound.tsx`.

**H1 on home**: `src/components/home/HeroSection.tsx` line 34 currently shows `"COLA B"` only. Keep the visual wordmark but:
- Wrap the visible "COLA B" in a `<span aria-hidden="true">` and add an `<h1 className="sr-only">Cola B — Queen of Emo Pop. Official music, videos, story, and merch.</h1>` above it.

**Brand tagline alignment**: `src/data/content.ts` `brand.tagline` currently reads "Singer-songwriter. Cultural personality…". Update to align with the "Queen of Emo Pop" positioning already in core memory.

## Files touched

```text
new:    src/components/seo/JsonLd.tsx
new:    public/_redirects
delete: public/sitemap.xml
edit:   src/hooks/useSEO.ts
edit:   src/pages/Index.tsx
edit:   src/pages/ReleasePage.tsx
edit:   src/pages/ProductDetail.tsx
edit:   src/pages/StoryDetail.tsx
edit:   src/pages/Music.tsx, Videos.tsx, Store.tsx, Story.tsx, Press.tsx,
        AboutCola.tsx, ChatPage.tsx, Policies.tsx, Privacy.tsx,
        Terms.tsx, NotFound.tsx
edit:   src/components/home/HeroSection.tsx
edit:   src/data/content.ts
edit:   index.html
edit:   public/robots.txt
edit:   supabase/functions/sitemap/index.ts
```

## Acceptance checklist

- Google Rich Results Test passes on `/`, `/release/:id`, `/product/:handle`, `/story/:id` with no errors and the expected entity types detected.
- `https://colabbmusic.com/sitemap.xml` returns one XML document containing every release, story, and Shopify product handle.
- `view-source` of every page in `src/pages/` shows non-default `<title>`, meta description, og:image, and at least one JSON-LD block.
- Home page DOM contains exactly one visible/AT-readable `<h1>` with descriptive keyword text.

Approve to implement.
