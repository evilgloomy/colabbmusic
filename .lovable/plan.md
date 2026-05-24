## Problem

Last week's security pass added a service-role bearer-token check to `sync-threads-posts`, `sync-releases`, `cache-album-art`, and `scrape-hyperfollow`. But the two pg_cron jobs that drive these on a schedule are still sending the **anon key** in the `Authorization` header — so every scheduled run now returns `401 unauthorized` and no new Threads stories (or release refreshes) land in the DB.

Current cron jobs:
- `sync-threads-posts-every-6h` (every 6h) → anon key
- `weekly-sync-releases-saturday` (Sat 01:00) → anon key

## Fix

Update both cron jobs to send the `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key, using `cron.alter_job` (or unschedule + reschedule). This is user-specific data (contains the service-role secret), so it goes through the **insert** tool, not a migration — matching the same pattern that originally created these jobs.

After updating, trigger `sync-threads-posts` once manually to confirm a 200 response and that new posts since the last successful run get backfilled.

## Technical details

1. Unschedule and recreate both jobs with the service-role key in the Authorization header. Schedules stay identical (`0 */6 * * *` and `0 1 * * 6`).
2. Verify via `cron.job` that the new commands are in place.
3. Invoke `sync-threads-posts` once with the service-role token and check `synced`/`refreshed` in the response + recent rows in `stories`.

No edge-function code, RLS, or frontend changes — the auth model added during the security fix is correct, only the scheduler was left behind.
