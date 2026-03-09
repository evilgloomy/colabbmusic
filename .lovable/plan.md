

# Plan: Scrape Full Release Data + Monitoring System

## Problem

The current scraper extracts 30 releases from `@Cola_BB/releases` but returns **empty thumbnails and empty years** for all of them. The `ytInitialData` structure has the playlist IDs but the thumbnail paths aren't being found correctly. Additionally, we need to fetch each song's description for release dates and build an auto-monitoring system.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  Cron Job (every 6 hours)                       │
│  pg_cron → calls sync-releases edge function    │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│  sync-releases Edge Function                    │
│  1. Scrape /releases page → get playlist IDs    │
│  2. For each playlist, fetch playlist page      │
│     → extract artwork + first video ID          │
│  3. For each video, fetch oEmbed / video page   │
│     → extract description (release date, etc.)  │
│  4. Upsert into `releases` table                │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│  releases (database table)                      │
│  id, title, playlist_id, video_id, thumbnail,   │
│  description, release_date, track_count,        │
│  created_at, updated_at                         │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│  Music Page (frontend)                          │
│  Reads from `releases` table via Supabase       │
│  Fast load, no scraping on page visit           │
└─────────────────────────────────────────────────┘
```

## Steps

### 1. Create `releases` database table

Store scraped release data persistently so the frontend reads from the DB (fast) instead of scraping YouTube on every page load.

Columns: `id`, `title`, `playlist_id` (unique), `video_id`, `thumbnail_url`, `description`, `release_date`, `track_count`, `year`, `created_at`, `updated_at`.

RLS: public read (no auth needed for a public artist site), no write from client.

### 2. Create `sync-releases` edge function

A new edge function that:
- Scrapes `@Cola_BB/releases` to get the list of playlist IDs and titles (existing logic, but fix thumbnail extraction)
- For each playlist, fetches `https://www.youtube.com/playlist?list={playlistId}` to extract the cover artwork and first video ID from the page HTML
- For each first video, fetches `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json` for the thumbnail, and fetches the video page to extract the description (which contains release date)
- Upserts all data into the `releases` table using the Supabase service role key
- Returns a summary of what was added/updated

### 3. Fix thumbnail extraction

The current `getBestThumbnail` returns empty because `ytInitialData` nests thumbnails differently for music releases (OLAK5uy_ playlists). The fix is to also look at `musicResponsiveListItemRenderer` paths and fall back to fetching artwork from the individual playlist page.

### 4. Update `fetch-youtube-feed` edge function

Keep the existing `mode: "releases"` but have it read from the `releases` DB table instead of scraping live. This makes the Music page load instantly.

### 5. Update Music page

Read releases from the database table. Display artwork, title, track count, release date, and description excerpt.

### 6. Set up cron job for monitoring

Use `pg_cron` + `pg_net` to call the `sync-releases` function every 6 hours. This automatically detects new releases as Cola B publishes them.

### 7. Update client-side types and queries

Update `src/lib/youtube.ts` to fetch from the DB table for releases. Keep the RSS feed path for the Videos page.

