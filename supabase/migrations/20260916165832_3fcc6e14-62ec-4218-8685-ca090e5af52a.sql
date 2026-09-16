-- Roles
CREATE TYPE public.live_app_role AS ENUM ('admin','producer','guest');

CREATE TABLE public.live_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.live_app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.live_user_roles TO authenticated;
GRANT ALL ON public.live_user_roles TO service_role;
ALTER TABLE public.live_user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.live_has_role(_user_id uuid, _role public.live_app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.live_user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.live_is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.live_user_roles WHERE user_id = _user_id AND role IN ('admin','producer'))
$$;

CREATE POLICY "live_roles_self_read" ON public.live_user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.live_has_role(auth.uid(), 'admin'));
CREATE POLICY "live_roles_admin_manage" ON public.live_user_roles
  FOR ALL TO authenticated USING (private.live_has_role(auth.uid(), 'admin')) WITH CHECK (private.live_has_role(auth.uid(), 'admin'));

-- Sessions
CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_organization text,
  interviewer_name text,
  primary_language text NOT NULL DEFAULT 'en',
  topic text,
  campaign text,
  talking_points text,
  topics_to_avoid text,
  unreleased_info text,
  approved_announcements text,
  music_releases text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  mock_mode boolean NOT NULL DEFAULT true,
  recording_enabled boolean NOT NULL DEFAULT false,
  silence_threshold_ms integer NOT NULL DEFAULT 750,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.live_session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  capacity text NOT NULL DEFAULT 'guest',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_session_participants TO authenticated;
GRANT ALL ON public.live_session_participants TO service_role;
ALTER TABLE public.live_session_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.live_can_access_session(_user_id uuid, _session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    private.live_has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = _session_id AND s.created_by = _user_id)
    OR EXISTS (SELECT 1 FROM public.live_session_participants p WHERE p.session_id = _session_id AND p.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION private.live_is_session_staff(_user_id uuid, _session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    private.live_has_role(_user_id, 'admin')
    OR (
      private.live_has_role(_user_id, 'producer') AND (
        EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = _session_id AND s.created_by = _user_id)
        OR EXISTS (SELECT 1 FROM public.live_session_participants p WHERE p.session_id = _session_id AND p.user_id = _user_id AND p.capacity IN ('producer','admin'))
      )
    )
$$;

CREATE POLICY "live_sessions_staff_read" ON public.live_sessions
  FOR SELECT TO authenticated USING (private.live_is_session_staff(auth.uid(), id));
CREATE POLICY "live_sessions_staff_insert" ON public.live_sessions
  FOR INSERT TO authenticated WITH CHECK (private.live_is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "live_sessions_staff_update" ON public.live_sessions
  FOR UPDATE TO authenticated USING (private.live_is_session_staff(auth.uid(), id)) WITH CHECK (private.live_is_session_staff(auth.uid(), id));
CREATE POLICY "live_sessions_admin_delete" ON public.live_sessions
  FOR DELETE TO authenticated USING (private.live_has_role(auth.uid(), 'admin'));

CREATE POLICY "live_participants_read" ON public.live_session_participants
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.live_is_session_staff(auth.uid(), session_id));
CREATE POLICY "live_participants_staff_write" ON public.live_session_participants
  FOR ALL TO authenticated USING (private.live_is_session_staff(auth.uid(), session_id)) WITH CHECK (private.live_is_session_staff(auth.uid(), session_id));

-- Guest-safe session summary (no briefing fields)
CREATE OR REPLACE FUNCTION public.live_guest_session_view(_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  IF NOT private.live_can_access_session(auth.uid(), _session_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  SELECT id, title, media_organization, interviewer_name, primary_language, status, silence_threshold_ms
    INTO s FROM public.live_sessions WHERE id = _session_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'id', s.id,
    'title', s.title,
    'media_organization', s.media_organization,
    'interviewer_name', s.interviewer_name,
    'primary_language', s.primary_language,
    'status', s.status,
    'silence_threshold_ms', s.silence_threshold_ms
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.live_guest_session_view(uuid) FROM anon;

-- Messages
CREATE TABLE public.live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  is_final boolean NOT NULL DEFAULT true,
  interrupted boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public',
  source text NOT NULL DEFAULT 'aurora',
  turn_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX live_messages_session_idx ON public.live_messages (session_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.live_messages TO authenticated;
GRANT ALL ON public.live_messages TO service_role;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_messages_staff_read" ON public.live_messages
  FOR SELECT TO authenticated USING (private.live_is_session_staff(auth.uid(), session_id));
CREATE POLICY "live_messages_guest_read" ON public.live_messages
  FOR SELECT TO authenticated USING (
    visibility = 'public'
    AND EXISTS (SELECT 1 FROM public.live_session_participants p WHERE p.session_id = live_messages.session_id AND p.user_id = auth.uid())
  );
CREATE POLICY "live_messages_staff_write" ON public.live_messages
  FOR INSERT TO authenticated WITH CHECK (private.live_is_session_staff(auth.uid(), session_id));
CREATE POLICY "live_messages_staff_update" ON public.live_messages
  FOR UPDATE TO authenticated USING (private.live_is_session_staff(auth.uid(), session_id)) WITH CHECK (private.live_is_session_staff(auth.uid(), session_id));

-- Context injections (producer only)
CREATE TABLE public.live_context_injections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'private',
  scope text NOT NULL DEFAULT 'ONE_TURN',
  content text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  consumed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_context_injections TO authenticated;
GRANT ALL ON public.live_context_injections TO service_role;
ALTER TABLE public.live_context_injections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_injections_staff_all" ON public.live_context_injections
  FOR ALL TO authenticated USING (private.live_is_session_staff(auth.uid(), session_id)) WITH CHECK (private.live_is_session_staff(auth.uid(), session_id));

-- LEMO states (producer only)
CREATE TABLE public.live_lemo_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.live_messages(id) ON DELETE SET NULL,
  emotion text,
  valence numeric,
  arousal numeric,
  warmth numeric,
  confidence numeric,
  energy numeric,
  speaking_rate numeric,
  pause_before_ms integer,
  delivery_note text,
  is_fallback boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.live_lemo_states TO authenticated;
GRANT ALL ON public.live_lemo_states TO service_role;
ALTER TABLE public.live_lemo_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_lemo_staff_all" ON public.live_lemo_states
  FOR ALL TO authenticated USING (private.live_is_session_staff(auth.uid(), session_id)) WITH CHECK (private.live_is_session_staff(auth.uid(), session_id));

-- Latency metrics (producer only)
CREATE TABLE public.live_latency_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.live_messages(id) ON DELETE SET NULL,
  speech_finalization_ms integer,
  aurora_ms integer,
  lemo_ms integer,
  voice_ttfa_ms integer,
  total_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.live_latency_metrics TO authenticated;
GRANT ALL ON public.live_latency_metrics TO service_role;
ALTER TABLE public.live_latency_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_latency_staff_all" ON public.live_latency_metrics
  FOR ALL TO authenticated USING (private.live_is_session_staff(auth.uid(), session_id)) WITH CHECK (private.live_is_session_staff(auth.uid(), session_id));

CREATE TRIGGER trg_live_sessions_updated_at BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();