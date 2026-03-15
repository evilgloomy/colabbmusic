

## Add Album Tracklist with Individual Playback

### Problem
Album release pages show track count but don't list individual songs or let users play them separately.

### Solution
Create a `release_tracks` table, populate it during sync by fetching all playlist items from YouTube, and display a tracklist on the ReleasePage with per-track play buttons.

### Changes

**1. Create `release_tracks` table (migration)**
```sql
CREATE TABLE public.release_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  title text NOT NULL,
  track_number integer NOT NULL,
  duration_seconds integer,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (release_id, video_id)
);
ALTER TABLE public.release_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read release_tracks" ON public.release_tracks FOR SELECT TO anon, authenticated USING (true);
```

**2. Update `sync-releases/index.ts`**
- After upserting releases, add a new step: for each album (track_count > 1 with a playlist_id), call `playlistItems?part=snippet,contentDetails&playlistId=...&maxResults=50` to get all tracks.
- Upsert rows into `release_tracks` with video_id, title, track_number, and thumbnail.
- Use the service role key for inserts.

**3. Update `ReleasePage.tsx`**
- Fetch tracks from `release_tracks` where `release_id = id`, ordered by `track_number`.
- For albums, render a numbered tracklist below the hero section with:
  - Track number, title, duration (if available)
  - A play button per track that swaps the YouTube embed to that track's `video_id`
  - Highlight the currently playing track
- The existing "Play Now" button plays the first track (or the release's main video_id).

**4. Update `src/lib/youtube.ts`**
- Add a `fetchReleaseTracks(releaseId: string)` helper that queries the `release_tracks` table.

### What stays the same
- Singles pages remain unchanged (no tracklist shown when track_count <= 1)
- All existing streaming links, artwork, and hero layout

