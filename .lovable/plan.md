

## Individual Release Pages with Auto-Fetched Data

### Current State
- Individual release pages already exist at `/release/:id` with YouTube embed + streaming links
- The front page (CurrentEra) shows the 5 most recent singles and already links to `/release/:id`
- The `scrape-hyperfollow` edge function exists but is only triggered manually
- The `releases` table has a `hyperfollow_url` column but it's not auto-populated
- The Music page cards link to YouTube directly, not to individual pages

### What Needs to Change

**1. Auto-scrape HyperFollow during release sync**
- Enhance the `sync-releases` edge function to automatically call `scrape-hyperfollow` for any release that has a `hyperfollow_url` set but no streaming links yet
- Add logic to auto-discover HyperFollow URLs by searching DistroKid for the release title (DistroKid URLs follow the pattern `https://distrokid.com/hyperfollow/colab/<slug>`)

**2. Link front page releases to individual pages**
- The CurrentEra component already links to `/release/:id` — no changes needed there
- Update the Music page `ReleaseCard` to link to `/release/:id` instead of YouTube for releases that appear on the front page (top 5 singles)

**3. Enrich release pages with more data**
- The `/release/:id` page already shows artwork, YouTube embed, description, and streaming links
- No structural changes needed — the page will automatically show richer data once HyperFollow scraping populates the `streaming_links` table

**4. Automate for new releases**
- The `sync-releases` cron already runs weekly — extend it to also trigger HyperFollow scraping for newly inserted releases
- After upserting releases, check which ones are new (inserted) and have a `hyperfollow_url`, then scrape their streaming links in the same run

### Technical Details

- **Edge function change**: Modify `sync-releases/index.ts` to call the `scrape-hyperfollow` function internally (inline the logic or HTTP-invoke it) after upserting new releases
- **HyperFollow URL discovery**: Add a step that constructs candidate HyperFollow URLs from the release title slug and checks if they exist, then stores the URL in the `hyperfollow_url` column
- **Music page routing**: Update `ReleaseCard` to use `<Link to={/release/${release.id}>}` instead of external YouTube links

### Files to modify
- `supabase/functions/sync-releases/index.ts` — add post-sync HyperFollow scraping
- `src/pages/Music.tsx` — update ReleaseCard to link to `/release/:id`

