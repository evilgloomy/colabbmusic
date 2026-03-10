

## SEO Improvement Plan

Your site is a client-rendered React SPA, which has inherent SEO limitations. Here's what we can do within that constraint, ranked by impact.

### Current State
- **Only StoryDetail** sets dynamic `document.title` and OG meta tags; all other pages use the static `index.html` defaults
- **No sitemap.xml** exists
- **No canonical URLs** are set
- **robots.txt** is fine but missing a sitemap reference
- **`meta author`** says "Lovable" instead of "Cola B" / "Shiba Inu Media"
- **`twitter:site`** points to `@Lovable` instead of Cola B's account
- **No structured data** (JSON-LD) for music, products, or articles
- **No per-page `<title>` or meta descriptions** for Music, Videos, Store, Press, Story pages

### Plan

**1. Create a reusable `useSEO` hook**
Extract the pattern from StoryDetail into a shared `src/hooks/useSEO.ts` hook that sets `document.title`, OG tags, twitter tags, and canonical URL. Clean up on unmount.

**2. Add per-page SEO to every route**
Call the hook in each page component with unique title + description:
- `/music` → "Music — Cola B | Latest Releases & Singles"
- `/videos` → "Videos — Cola B | Official Music Videos"
- `/store` → "Store — Cola B | Official Merchandise"
- `/press` → "Press — Cola B | Press Kit & Media"
- `/story` → "Story — Cola B | Life, Music & Moments"
- `/release/:id` → dynamic: "{release title} — Cola B"
- `/product/:handle` → dynamic: "{product title} — Cola B Store"

**3. Fix index.html meta tags**
- Change `meta author` from "Lovable" to "Shiba Inu Media"
- Change `twitter:site` from `@Lovable` to `@cola_bb_official` (or remove if no X account)
- Remove TODO comments

**4. Generate a static sitemap.xml**
Create `public/sitemap.xml` listing all known static routes (`/`, `/music`, `/videos`, `/store`, `/press`, `/story`, `/chat`). Update `robots.txt` to reference it.

**5. Add JSON-LD structured data**
- Homepage: `MusicGroup` schema for Cola B
- Store/ProductDetail: `Product` schema
- ReleasePage: `MusicAlbum` / `MusicRecording` schema
- StoryDetail: `Article` schema

**6. Add canonical link tags**
The `useSEO` hook will inject `<link rel="canonical" href="...">` for each page to avoid duplicate content issues.

### Limitations
Since this is a client-side SPA, search engine crawlers that don't execute JavaScript won't see dynamic meta tags. The static `index.html` tags serve as fallbacks. For full SSR-based SEO you'd need a prerendering service, but these changes will significantly improve Google (which does run JS) and social sharing previews.

