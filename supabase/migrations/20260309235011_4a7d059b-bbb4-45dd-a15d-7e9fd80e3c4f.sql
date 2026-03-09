
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threads_post_id text UNIQUE NOT NULL,
  original_text text,
  ai_enhanced_text text,
  ai_title text,
  category text DEFAULT 'lifestyle',
  media_url text,
  media_type text,
  permalink text,
  posted_at timestamp with time zone,
  location text,
  featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read stories"
  ON public.stories
  FOR SELECT
  TO anon, authenticated
  USING (true);
