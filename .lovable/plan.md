

## Fix Album Art: Cache Thumbnails in Storage

**Problem**: YouTube playlist thumbnail URLs contain signed parameters that expire, causing broken images. The current video-based fallback (`img.youtube.com/vi/...`) works but shows the video frame, not the actual album cover art.

**Solution**: Download each release's thumbnail once into a storage bucket and store the permanent public URL in the database. This costs minimal bandwidth (~1-2MB total for ~30 releases) and permanently solves the expiry problem.

### Steps

1. **Create a public `album-art` storage bucket** via migration with an open read policy.

2. **Create an edge function `cache-album-art`** that:
   - Queries all releases from the `releases` table
   - For each release that doesn't already have a cached URL, downloads the thumbnail from the signed YouTube URL (falling back to `img.youtube.com/vi/{video_id}/mqdefault.jpg`)
   - Uploads the image to `album-art/{release_id}.jpg` in storage
   - Updates the release row with the new permanent public storage URL in `thumbnail_url`
   - This runs once to backfill, and can be re-invoked when new releases are synced

3. **Update `sync-releases` edge function** to also cache thumbnails when syncing new releases, so future releases are automatically cached.

4. **Update `ReleaseCard` in `Music.tsx`** to simplify — remove the fallback chain since URLs will now be permanent. Keep a simple fallback to the YouTube video thumbnail as a safety net.

### Technical Details

- Storage bucket: `album-art`, public, with anonymous read access
- New column not needed — we reuse `thumbnail_url` but overwrite it with the storage URL
- Images are ~20-50KB each, total storage under 2MB for the full catalog
- The edge function uses the service role key to write to storage and update rows
- Public bucket URLs are permanent: `https://{project}.supabase.co/storage/v1/object/public/album-art/{id}.jpg`

