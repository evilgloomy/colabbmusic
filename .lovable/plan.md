

## Scrape HyperFollow Streaming Links for All Songs

### Problem
Only 1 of 121 releases has streaming links. The current slug-guessing approach fails because:
- Chinese titles produce empty slugs
- DistroKid appends numbers for common words (e.g., "fire" becomes "fire-3", "run" becomes "run-5")
- No way to predict the exact slug without discovering it first

### Solution: Use Firecrawl Map to Discover All URLs

Instead of guessing slugs, use Firecrawl's **map** API to crawl `distrokid.com/hyperfollow/colab2/` and get a list of all actual HyperFollow page URLs. Then match each URL to a release by comparing the page title to release titles, and scrape streaming links.

### Implementation

**1. Update `sync-releases/index.ts` — replace `discoverAndScrapeHyperFollow`**

New flow:
1. Call Firecrawl Map API: `POST https://api.firecrawl.dev/v1/map` with `url: "https://distrokid.com/hyperfollow/colab2/"` to get all HyperFollow URLs
2. For each discovered URL, scrape the page with Firecrawl (HTML format)
3. Extract the song title from the page HTML (e.g., `<title>CLOWNS by Cola B</title>`)
4. Fuzzy-match the title against the `releases` table (normalize both sides: lowercase, strip punctuation)
5. If matched and no existing streaming links, extract platform links and upsert to `streaming_links`
6. Store the `hyperfollow_url` on the matched release row

This runs as Step 4 of the existing sync, so it automatically applies to new songs added in future syncs.

**2. Rate limiting and batching**
- Firecrawl map is 1 API call to get all URLs
- Scraping each URL: batch 3 at a time with 1.5s delay (to stay within Firecrawl rate limits)
- Skip releases that already have streaming links in the DB

**3. Title matching logic**
- Normalize: lowercase, remove parentheticals like "(Cola Ver)", strip non-alphanumeric
- Match page title (from HTML `<title>X by Cola B</title>`) against release titles
- Handle Chinese titles by exact match on the original characters

### Files to modify
- `supabase/functions/sync-releases/index.ts` — rewrite `discoverAndScrapeHyperFollow` to use Firecrawl map + scrape approach

### No frontend changes needed
The release pages already display streaming links when they exist in the DB.

