INSERT INTO storage.buckets (id, name, public) VALUES ('story-media', 'story-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for story-media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'story-media');

CREATE POLICY "Service role can manage story-media" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'story-media') WITH CHECK (bucket_id = 'story-media');