
-- Add hyperfollow_url to releases
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS hyperfollow_url text;

-- Create streaming_links table
CREATE TABLE public.streaming_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES public.releases(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(release_id, platform)
);

-- Enable RLS
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read streaming_links"
  ON public.streaming_links
  FOR SELECT
  TO anon, authenticated
  USING (true);
