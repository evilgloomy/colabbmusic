

## Fix: Older Stories Losing Media (Expired Threads CDN URLs)

### Problem
Story media URLs point directly to Threads/Instagram CDN (`scontent-*.cdninstagram.com`). These URLs contain expiration tokens (`oe=...`) and stop working after a few days/weeks. Older stories show broken images because their CDN URLs have expired.

### Solution
Cache story media into the existing `album-art` Supabase Storage bucket (or a new `story-media` bucket) at sync time, similar to how album art is already cached. Then store the permanent Supabase Storage URL in the database instead of the expiring CDN URL.

### Changes

**1. Create a `story-media` storage bucket**
- Add a new public bucket via migration or storage API for story images/videos.

**2. Update `supabase/functions/sync-threads-posts/index.ts`**
- After fetching each post from Threads, download the `media_url` binary content.
- Upload it to `story-media/{story_id}.{ext}` in Supabase Storage (determine extension from media_type: `.jpg` for IMAGE, `.mp4` for VIDEO).
- Store the permanent public Supabase Storage URL in the `media_url` column instead of the CDN URL.
- For CAROUSEL_ALBUM, cache the first image.

**3. Add a media refresh pass for existing stories**
- In the sync function, after processing new posts, also check existing stories where `media_url` still points to `cdninstagram.com`.
- For those, re-fetch the media URL from the Threads API (since the API always returns fresh CDN URLs) and cache it to storage.
- This one-time migration fixes all currently broken older stories.

**4. Keep the original CDN URL as a fallback**
- Add a column or use the existing flow: if storage upload fails, keep the CDN URL so at least recent posts still work.

### Technical Detail
- The Threads API `me/threads` endpoint returns fresh CDN URLs on every call, even for old posts. During sync, we already fetch all posts (up to 150). For existing posts whose media is not yet cached, we can use the fresh URL from the API response to download and cache the media.
- Image files are typically 50-200KB each; video files vary but thumbnails can be used as fallback.

