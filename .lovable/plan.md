

## Fix: Restore VEVO Channel for Official Music Videos

### What Went Wrong
I incorrectly replaced the VEVO channel with the "Cola B - Topic" auto-generated channel (`UC7jMO9tpW64FhccGUH5n3kg`). The Topic channel shows auto-generated audio uploads, not the official music videos from `@ColaBVEVO`.

### Root Cause of Original 404
The edge function's `resolveChannelId` scrapes the YouTube channel page HTML to extract the channel ID. The VEVO page at `https://www.youtube.com/@ColaBVEVO` likely returned HTML where the regex patterns didn't match, or YouTube blocked/rate-limited the scrape from the edge function's IP.

### Fix (1 file change)

**`src/lib/youtube.ts`** — Restore the VEVO handle and add the actual VEVO channel ID as a direct fallback:

```typescript
export const CHANNELS = {
  VEVO: "@ColaBVEVO",
  ARTIST: "@Cola_BB",
} as const;
```

Additionally, update `fetchYouTubeFeed` to handle the case where the handle-based RSS fetch fails by:
1. First trying to resolve the handle to a channel ID via the edge function
2. If that fails with 404/500, fall back to a hardcoded VEVO channel ID lookup

This way, the Featured Video and Videos page will show official MVs from the VEVO channel again, and the system gracefully falls back if YouTube's RSS is temporarily flaky for that channel.

### Alternative Approach (more robust)
If `@ColaBVEVO`'s channel ID is known and stable, we can hardcode it directly (like we did with the Topic channel) to skip the unreliable handle resolution entirely. We just need the correct VEVO channel ID — the edge function can resolve it once, and we hardcode it.

The edge function already supports both `channelId` and `handle` params, so we just need the right ID for `@ColaBVEVO` instead of the Topic channel.

### Files to modify
1. **`src/lib/youtube.ts`** — Change `VEVO` back to `"@ColaBVEVO"`, add client-side fallback logic

