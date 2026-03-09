

# Plan: Fix Release Ordering + Weekly Cron Sync

## Problem
The current sorting relies on "Last updated on ..." text from YouTube playlist pages. This is NOT the actual release date — it's when YouTube last modified the playlist metadata. As a result, "Wonderful U" (which should be the newest release) shows a sort_date of 2025-09-25 and appears in the middle, while "重重疊疊" has no date at all and sinks to the bottom.

## Solution

### 1. Use scrape order as the source of truth for sorting

YouTube's `/releases` page already lists releases in correct chronological order (newest first). Instead of relying on the unreliable "Last updated on" text, assign a `sort_order` integer based on the position scraped from the page (0 = newest, 1 = next, etc.).

**Changes to `sync-releases/index.ts`:**
- Add a `scrapeIndex` field to `ScrapedRelease` — the index from the YouTube page order
- When extracting releases in `extractReleasesFromItems` and during pagination, track a running counter
- Add a new `sort_order` column to the DB (integer, lower = newer)
- During upsert, write `sort_order` for each release
- Keep `sort_date` as a secondary reference but stop relying on it for ordering

### 2. Add `sort_order` column via migration

```sql
ALTER TABLE public.releases ADD COLUMN sort_order integer;
```

### 3. Update frontend query to sort by `sort_order`

**Changes to `src/lib/youtube.ts`:**
- Change `.order("sort_date", ...)` to `.order("sort_order", { ascending: true, nullsFirst: false })`
- This ensures the display matches YouTube's actual release order

### 4. Fix "重重疊疊" — re-sync will populate its `sort_order`

Once the sync runs with the new logic, every release including "重重疊疊" will get a correct `sort_order` based on where it appears on the YouTube page.

### 5. Schedule weekly cron job — every Friday at 1:00 AM UTC

Enable `pg_cron` and `pg_net` extensions, then create a cron job:

```sql
SELECT cron.schedule(
  'weekly-sync-releases',
  '0 1 * * 5',  -- Friday at 1:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://tfcrxvnfuagmqwkxoyei.supabase.co/functions/v1/sync-releases',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"scheduled":true}'::jsonb
  ) AS request_id;
  $$
);
```

## Files changed
- `supabase/functions/sync-releases/index.ts` — track scrape order, write `sort_order`
- `src/lib/youtube.ts` — sort by `sort_order ASC` instead of `sort_date DESC`
- DB migration: add `sort_order` integer column
- DB insert: enable `pg_cron`/`pg_net`, create weekly schedule
- Re-run sync to populate all 121 releases with correct ordering

