-- Newsletter subscribers
CREATE TABLE public.subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  source text,
  locale text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on email
CREATE UNIQUE INDEX subscribers_email_lower_idx ON public.subscribers (lower(email));
CREATE INDEX subscribers_ip_hash_created_at_idx ON public.subscribers (ip_hash, created_at);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- No public policies: all writes go through the `subscribe` edge function
-- using the service role key, which bypasses RLS. No SELECT/INSERT/UPDATE/DELETE
-- policies are intentionally defined.
