

## Update Release Sync Schedule to Saturday

**Current state**: Two cron jobs exist:
- Job 1: Every 6 hours (aggressive, may be unnecessary)
- Job 2: Every Friday at 1 AM UTC

**What's likely happening**: The sync is running but may not be finding the new release due to YouTube scraping/pagination issues, not a scheduling problem.

### Plan

1. **Update cron schedule** — Change job 2 from Friday (`5`) to Saturday (`6`): `0 1 * * 6` (Saturday 1 AM UTC)

2. **Remove the redundant 6-hour job** (job 1) — It's duplicating job 2 and wastes resources. One weekly sync plus the ability to manually trigger should be sufficient.

3. **Trigger a manual sync now** — Invoke the `sync-releases` edge function to pull in the new release immediately.

4. **Check sync-releases logs** — Review edge function logs to see if the latest sync ran successfully or encountered errors finding the new content.

### Technical Details
- Use `cron.unschedule` to remove job 1 and `cron.alter` to update job 2's schedule
- Invoke `sync-releases` via the Supabase edge function tools to trigger an immediate sync
- Check edge function logs for errors

