ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS is_direct boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS live_sessions_one_direct_per_user
  ON public.live_sessions (created_by) WHERE is_direct;

CREATE OR REPLACE FUNCTION public.live_get_or_create_direct_session()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  sid uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;
  IF NOT private.live_is_staff(uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT id INTO sid FROM public.live_sessions
   WHERE created_by = uid AND is_direct LIMIT 1;

  IF sid IS NULL THEN
    INSERT INTO public.live_sessions (title, primary_language, status, mock_mode, silence_threshold_ms, created_by, is_direct, notes)
    VALUES ('Cola Live — Direct', 'en', 'active', false, 750, uid, true,
            'Private direct conversation room for staff. Not an outlet interview.')
    RETURNING id INTO sid;
  ELSE
    UPDATE public.live_sessions SET status = 'active', updated_at = now() WHERE id = sid AND status = 'ended';
  END IF;

  RETURN jsonb_build_object('ok', true, 'session_id', sid);
END;
$$;

REVOKE ALL ON FUNCTION public.live_get_or_create_direct_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.live_get_or_create_direct_session() TO authenticated, service_role;