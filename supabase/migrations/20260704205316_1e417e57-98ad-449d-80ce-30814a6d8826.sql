
-- 1. Private schema for security-definer helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

-- 2. Move RLS helper functions out of exposed public schema
ALTER FUNCTION public.aipf_has_role(uuid, public.aipf_app_role) SET SCHEMA private;
ALTER FUNCTION public.aipf_is_admin_or_reviewer() SET SCHEMA private;

-- Reset search_path (kept as public so enum types resolve)
ALTER FUNCTION private.aipf_has_role(uuid, public.aipf_app_role) SET search_path = public;
ALTER FUNCTION private.aipf_is_admin_or_reviewer() SET search_path = public;

-- Restrict EXECUTE
REVOKE EXECUTE ON FUNCTION private.aipf_has_role(uuid, public.aipf_app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.aipf_is_admin_or_reviewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.aipf_has_role(uuid, public.aipf_app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.aipf_is_admin_or_reviewer() TO authenticated, service_role;

-- 3. Lock down aipf_handle_new_user (trigger-only, no RPC needed)
REVOKE EXECUTE ON FUNCTION public.aipf_handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Recreate policies that referenced the moved functions
DROP POLICY IF EXISTS "aipf_interest admin all" ON public.aipf_interest_submissions;
CREATE POLICY "aipf_interest admin all" ON public.aipf_interest_submissions
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_nominations admin all" ON public.aipf_nominations;
CREATE POLICY "aipf_nominations admin all" ON public.aipf_nominations
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_invitations admin all" ON public.aipf_invitations;
CREATE POLICY "aipf_invitations admin all" ON public.aipf_invitations
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_user_roles self read" ON public.aipf_user_roles;
CREATE POLICY "aipf_user_roles self read" ON public.aipf_user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "aipf_user_roles admin manage" ON public.aipf_user_roles;
CREATE POLICY "aipf_user_roles admin manage" ON public.aipf_user_roles
  FOR ALL TO authenticated
  USING (private.aipf_has_role(auth.uid(), 'admin'::public.aipf_app_role))
  WITH CHECK (private.aipf_has_role(auth.uid(), 'admin'::public.aipf_app_role));

DROP POLICY IF EXISTS "aipf_entities admin all" ON public.aipf_entities;
CREATE POLICY "aipf_entities admin all" ON public.aipf_entities
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_entity_links admin all" ON public.aipf_entity_links;
CREATE POLICY "aipf_entity_links admin all" ON public.aipf_entity_links
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_achievements admin all" ON public.aipf_entity_achievements;
CREATE POLICY "aipf_achievements admin all" ON public.aipf_entity_achievements
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_reports admin all" ON public.aipf_broken_link_reports;
CREATE POLICY "aipf_reports admin all" ON public.aipf_broken_link_reports
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_journal admin all" ON public.aipf_journal_posts;
CREATE POLICY "aipf_journal admin all" ON public.aipf_journal_posts
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

DROP POLICY IF EXISTS "aipf_contact admin all" ON public.aipf_contact_messages;
CREATE POLICY "aipf_contact admin all" ON public.aipf_contact_messages
  FOR ALL TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

-- 5. Tighten public-insert policies: replace WITH CHECK (true) with sanity checks
DROP POLICY IF EXISTS "aipf_nominations public insert" ON public.aipf_nominations;
CREATE POLICY "aipf_nominations public insert" ON public.aipf_nominations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    good_faith = true
    AND status = 'submitted'
    AND reviewer_id IS NULL
    AND internal_notes IS NULL
    AND length(nominee_entity_name) BETWEEN 1 AND 200
  );

DROP POLICY IF EXISTS "aipf_reports public insert" ON public.aipf_broken_link_reports;
CREATE POLICY "aipf_reports public insert" ON public.aipf_broken_link_reports
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    resolved = false
    AND internal_notes IS NULL
    AND (message IS NOT NULL OR issue_type IS NOT NULL OR entity_link_id IS NOT NULL OR entity_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "aipf_interest public insert" ON public.aipf_interest_submissions;
CREATE POLICY "aipf_interest public insert" ON public.aipf_interest_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    authorized = true
    AND understands_no_guarantee = true
    AND status = 'submitted'
    AND reviewer_id IS NULL
    AND internal_notes IS NULL
    AND length(entity_name) BETWEEN 1 AND 200
    AND length(creator_studio_name) BETWEEN 1 AND 200
  );

DROP POLICY IF EXISTS "aipf_contact public insert" ON public.aipf_contact_messages;
CREATE POLICY "aipf_contact public insert" ON public.aipf_contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    resolved = false
    AND internal_notes IS NULL
    AND message IS NOT NULL
    AND length(message) BETWEEN 1 AND 5000
  );
