
-- Create releases table
CREATE TABLE public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  playlist_id text UNIQUE,
  video_id text,
  thumbnail_url text,
  description text,
  release_date text,
  track_count integer,
  year text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

-- Public read access (artist website, no auth needed)
CREATE POLICY "Public can read releases" ON public.releases
  FOR SELECT TO anon, authenticated
  USING (true);

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
