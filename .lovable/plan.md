

# Plan: Fix Sorting & Complete Discography

## Problems Identified

1. **Sorting is broken**: The `release_date` column contains text like `"Last updated on Feb 27, 2026"` — Postgres sorts this alphabetically, not chronologically. So "Feb" comes before "Jan", "Sep" before "Oct", etc. The ordering is completely wrong.

2. **30 releases scraped**: The YouTube `/releases` page shows 30 releases, which is what we have. The scraper is getting everything YouTube exposes. (The official website at colabbmusic.com is a Shopify merch store — no music catalog there.)

3. **One release missing year/date**: "重重疊疊" has no year or release_date.

## Solution

### 1. Add a proper `sort_date` column to the `releases` table

Add a `DATE` type column called `sort_date` that stores the parsed date from the "Last updated on Mon DD, YYYY" text. This enables correct chronological sorting.

### 2. Update the `sync-releases` edge function

- Parse "Last updated on Feb 27, 2026" → `2026-02-27` DATE value during upsert
- Also populate `sort_date` from the year field as a fallback (e.g., `2025-01-01` if only year is known)

### 3. Update the client query to sort by `sort_date`

Change `fetchReleases()` to `ORDER BY sort_date DESC NULLS LAST` instead of the current broken text-based sorting.

### 4. Re-run the sync to populate `sort_date` for all 30 existing releases

Trigger the sync function after deploying the updated edge function so all existing records get their `sort_date` populated.

### 5. Ensure completeness

The scraper currently captures all releases from the YouTube `/releases` tab. If YouTube adds more releases over time, the cron job (every 6 hours) will pick them up automatically. No additional source is needed since the official website is a merch store, not a music catalog.

