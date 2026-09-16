REVOKE ALL ON FUNCTION public.live_guest_session_view(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.live_guest_session_view(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.live_guest_session_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_guest_session_view(uuid) TO service_role;