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