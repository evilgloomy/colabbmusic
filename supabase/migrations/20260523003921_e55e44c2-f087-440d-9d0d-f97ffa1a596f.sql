
-- Drop broad public SELECT policies on storage.objects for album-art and story-media.
-- Public bucket URLs continue to serve files directly; only the list API is restricted.
DROP POLICY IF EXISTS "Public read album-art" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for story-media" ON storage.objects;

-- Explicit deny policy on subscribers so the "RLS enabled but no policy" linter is satisfied.
-- The subscribe edge function uses the service role, which bypasses RLS.
CREATE POLICY "No client access to subscribers"
ON public.subscribers
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
