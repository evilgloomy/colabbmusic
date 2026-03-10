

## Auto-Sync Threads Posts Every 6 Hours

Set up a `pg_cron` scheduled job to invoke the `sync-threads-posts` edge function every 6 hours, matching the pattern already used for the weekly `sync-releases` job.

### Implementation

1. **Enable extensions** — Ensure `pg_cron` and `pg_net` are enabled (likely already done for the releases sync).

2. **Create cron job** — Run SQL (via insert tool, not migration) to schedule the function call every 6 hours:
   - Cron expression: `0 */6 * * *` (at minute 0 of every 6th hour)
   - Calls `sync-threads-posts` edge function with the anon key auth header

No code file changes needed — this is purely a database-level scheduled job.

