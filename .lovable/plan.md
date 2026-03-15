

## Rewrite sync-releases to Use `@Cola_BB/releases` as Single Source of Truth

### Problem
The `sync-releases` function currently fetches uploads from the **VEVO channel** (`UCCoEVSxdgOn_gcFI2jEFUEQ`), which only has music videos. The actual discography lives at `@Cola_BB/releases`. The MV filter then removes everything from VEVO, resulting in 0 releases synced — so new songs like 龍捲風 never appear.

### Solution
Replace the VEVO uploads-based sync with the YouTube Data API targeting the **artist channel** (`@Cola_BB`). The API's `playlists` endpoint returns official YouTube Music releases (identified by `OLAK5uy_` prefixed playlist IDs), which is exactly the `/releases` tab content.

### Changes

**1. Rewrite `supabase/functions/sync-releases/index.ts` — main sync logic (lines 6-136)**

Replace `fetchChannelUploads` (VEVO uploads) with a new `fetchArtistReleases` function:
- Resolve `@Cola_BB` → channel ID via `channels?forHandle=@Cola_BB` API
- Fetch all playlists via `playlists?channelId=...&maxResults=50` (paginated)
- Filter to only `OLAK5uy_` prefixed playlist IDs (YouTube Music releases)
- For each playlist, fetch first item via `playlistItems` to get video ID and thumbnail
- Extract track count from playlist `itemCount`
- Return structured release data with playlist_id, video_id, title, thumbnail, publish date, track_count

**2. Update main handler (lines 501-538)**

- Call `fetchArtistReleases` instead of `fetchChannelUploads`
- Remove the MV filter (no longer needed — releases tab has no MVs)
- Map playlist data to the existing `enrichRelease` format, preserving `playlist_id` and `track_count`
- Keep all downstream logic: upsert, album art caching, HyperFollow scraping

**3. Update `enrichRelease` to handle playlist-based data**

Accept playlist metadata (title, publishedAt, thumbnail, playlistId, videoId, trackCount) instead of just video uploads.

**4. Deploy and trigger full sync**

Redeploy the edge function and invoke it to import the full catalog from `@Cola_BB/releases`, including 龍捲風.

### What stays the same
- Upsert logic, HyperFollow scraping, album art caching, cron schedule
- Database schema (releases table already has `playlist_id`, `track_count` columns)
- All frontend code (Music page, ReleasePage, FeaturedMusic)

### API quota
~3-5 calls per sync: 1 channel lookup + 1-2 playlist pages + 1 playlistItems call per new release. Well within free tier.

