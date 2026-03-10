INSERT INTO storage.buckets (id, name, public) VALUES ('album-art', 'album-art', true);

CREATE POLICY "Public read album-art"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'album-art');

CREATE POLICY "Service role manage album-art"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'album-art');

CREATE POLICY "Service role update album-art"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'album-art')
WITH CHECK (bucket_id = 'album-art');