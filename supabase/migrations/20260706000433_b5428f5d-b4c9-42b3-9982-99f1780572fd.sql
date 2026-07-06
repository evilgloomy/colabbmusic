-- ============================================================
-- AIPF Member Claim Flow
-- ============================================================
CREATE TABLE public.aipf_onboarding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.aipf_invitations(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.aipf_entities(id) ON DELETE SET NULL,
  entity_name text NOT NULL,
  creator_studio_name text,
  country_region text,
  category text,
  bio text,
  official_image_url text,
  logo_url text,
  year_launched int,
  follower_count text,
  contact_email text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  accepted_principles boolean NOT NULL DEFAULT false,
  oath_signature text NOT NULL,
  oath_signed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX aipf_onboarding_one_pending
  ON public.aipf_onboarding_submissions (invitation_id)
  WHERE status = 'submitted';

GRANT SELECT, UPDATE ON public.aipf_onboarding_submissions TO authenticated;
GRANT ALL ON public.aipf_onboarding_submissions TO service_role;
ALTER TABLE public.aipf_onboarding_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aipf_onboarding admin read" ON public.aipf_onboarding_submissions
  FOR SELECT TO authenticated USING (private.aipf_is_admin_or_reviewer());
CREATE POLICY "aipf_onboarding admin update" ON public.aipf_onboarding_submissions
  FOR UPDATE TO authenticated
  USING (private.aipf_is_admin_or_reviewer())
  WITH CHECK (private.aipf_is_admin_or_reviewer());

CREATE TRIGGER trg_aipf_onboarding_updated_at
  BEFORE UPDATE ON public.aipf_onboarding_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
CREATE OR REPLACE FUNCTION public.aipf_lookup_invitation(_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv record;
  ent public.aipf_entities%ROWTYPE;
BEGIN
  IF _code IS NULL OR length(trim(_code)) < 8 OR length(_code) > 64 THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT * INTO inv
  FROM public.aipf_invitations
  WHERE upper(invitation_code) = upper(trim(_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  IF inv.status = 'accepted' THEN
    RETURN jsonb_build_object('found', true, 'claimable', false, 'reason', 'already_claimed');
  END IF;
  IF inv.status NOT IN ('drafted','ready','sent') THEN
    RETURN jsonb_build_object('found', true, 'claimable', false, 'reason', 'not_claimable');
  END IF;

  IF inv.entity_id IS NOT NULL THEN
    SELECT * INTO ent FROM public.aipf_entities WHERE id = inv.entity_id;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'claimable', true,
    'member_type', inv.member_type,
    'member_number', inv.member_number,
    'entity_name', COALESCE(ent.entity_name, NULL),
    'creator_studio_name', COALESCE(ent.creator_studio_name, NULL),
    'country_region', COALESCE(ent.country_region, NULL),
    'category', COALESCE(ent.category, NULL),
    'bio', COALESCE(ent.bio, NULL),
    'official_image_url', COALESCE(ent.official_image_url, NULL),
    'logo_url', COALESCE(ent.logo_url, NULL),
    'year_launched', COALESCE(ent.year_launched, NULL),
    'follower_count', COALESCE(ent.follower_count, NULL)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aipf_lookup_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aipf_lookup_invitation(text) TO anon, authenticated, service_role;

-- ============================================================
CREATE OR REPLACE FUNCTION public.aipf_submit_onboarding(_code text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv record;
  links jsonb;
  link_count int;
  new_id uuid;
BEGIN
  IF _code IS NULL OR length(trim(_code)) < 8 OR length(_code) > 64 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT * INTO inv
  FROM public.aipf_invitations
  WHERE upper(invitation_code) = upper(trim(_code))
  FOR UPDATE;

  IF NOT FOUND OR inv.status NOT IN ('drafted','ready','sent') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF coalesce(length(trim(_payload->>'entity_name')), 0) NOT BETWEEN 1 AND 200 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_entity_name');
  END IF;
  IF coalesce(length(trim(_payload->>'oath_signature')), 0) NOT BETWEEN 1 AND 200 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_signature');
  END IF;
  IF coalesce((_payload->>'accepted_principles')::boolean, false) IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('ok', false, 'error', 'principles_required');
  END IF;
  IF coalesce(length(_payload->>'bio'), 0) > 2000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bio_too_long');
  END IF;

  links := coalesce(_payload->'links', '[]'::jsonb);
  IF jsonb_typeof(links) IS DISTINCT FROM 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_links');
  END IF;
  SELECT count(*) INTO link_count FROM jsonb_array_elements(links) AS l
  WHERE coalesce(length(l->>'url'), 0) BETWEEN 1 AND 500
    AND (l->>'url') ~* '^https?://';
  IF jsonb_array_length(links) > 12 OR link_count <> jsonb_array_length(links) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_links');
  END IF;

  INSERT INTO public.aipf_onboarding_submissions (
    invitation_id, entity_id, entity_name, creator_studio_name, country_region,
    category, bio, official_image_url, logo_url, year_launched, follower_count,
    contact_email, links, accepted_principles, oath_signature
  ) VALUES (
    inv.id,
    inv.entity_id,
    left(trim(_payload->>'entity_name'), 200),
    left(nullif(trim(coalesce(_payload->>'creator_studio_name','')), ''), 200),
    left(nullif(trim(coalesce(_payload->>'country_region','')), ''), 120),
    left(nullif(trim(coalesce(_payload->>'category','')), ''), 120),
    nullif(trim(coalesce(_payload->>'bio','')), ''),
    left(nullif(trim(coalesce(_payload->>'official_image_url','')), ''), 500),
    left(nullif(trim(coalesce(_payload->>'logo_url','')), ''), 500),
    CASE WHEN _payload->>'year_launched' ~ '^\d{4}$' THEN (_payload->>'year_launched')::int ELSE NULL END,
    left(nullif(trim(coalesce(_payload->>'follower_count','')), ''), 50),
    left(nullif(trim(coalesce(_payload->>'contact_email','')), ''), 255),
    links,
    true,
    left(trim(_payload->>'oath_signature'), 200)
  )
  RETURNING id INTO new_id;

  UPDATE public.aipf_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  RETURN jsonb_build_object('ok', true, 'submission_id', new_id, 'member_number', inv.member_number);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_submitted');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aipf_submit_onboarding(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aipf_submit_onboarding(text, jsonb) TO anon, authenticated, service_role;

-- ============================================================
CREATE OR REPLACE FUNCTION public.aipf_approve_onboarding(_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sub record;
  inv record;
  target_entity_id uuid;
  target_slug text;
  base_slug text;
  suffix int := 1;
  assigned_number text;
  max_num int;
  l record;
BEGIN
  IF NOT private.aipf_is_admin_or_reviewer() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO sub FROM public.aipf_onboarding_submissions
  WHERE id = _submission_id AND status = 'submitted'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO inv FROM public.aipf_invitations WHERE id = sub.invitation_id;

  PERFORM pg_advisory_xact_lock(hashtext('aipf_member_number'));

  assigned_number := inv.member_number;
  IF assigned_number IS NULL THEN
    SELECT coalesce(max((regexp_match(n, 'AIPF-2026-(\d+)'))[1]::int), 0) INTO max_num
    FROM (
      SELECT member_number AS n FROM public.aipf_entities WHERE member_number IS NOT NULL
      UNION ALL
      SELECT member_number FROM public.aipf_invitations WHERE member_number IS NOT NULL
    ) nums
    WHERE n ~ 'AIPF-2026-\d+';
    assigned_number := 'AIPF-2026-' || lpad((max_num + 1)::text, 3, '0');
  END IF;

  target_entity_id := coalesce(sub.entity_id, inv.entity_id);

  IF target_entity_id IS NULL THEN
    base_slug := regexp_replace(lower(trim(sub.entity_name)), '[^a-z0-9]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN base_slug := 'member'; END IF;
    target_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.aipf_entities WHERE slug = target_slug) LOOP
      suffix := suffix + 1;
      target_slug := base_slug || '-' || suffix::text;
    END LOOP;

    INSERT INTO public.aipf_entities (slug, entity_name)
    VALUES (target_slug, sub.entity_name)
    RETURNING id INTO target_entity_id;
  END IF;

  UPDATE public.aipf_entities SET
    entity_name = sub.entity_name,
    creator_studio_name = coalesce(sub.creator_studio_name, creator_studio_name),
    country_region = coalesce(sub.country_region, country_region),
    category = coalesce(sub.category, category),
    bio = coalesce(sub.bio, bio),
    official_image_url = coalesce(sub.official_image_url, official_image_url),
    logo_url = coalesce(sub.logo_url, logo_url),
    year_launched = coalesce(sub.year_launched, year_launched),
    follower_count = coalesce(sub.follower_count, follower_count),
    member_type = coalesce(inv.member_type, member_type),
    member_number = coalesce(member_number, assigned_number),
    founding_cohort = founding_cohort OR (coalesce(inv.member_type, '') = 'Founding Member'),
    verification_status = CASE
      WHEN verification_status IN ('unverified','identity_reviewed') THEN 'verified'
      ELSE verification_status
    END,
    published = true
  WHERE id = target_entity_id
  RETURNING slug, member_number INTO target_slug, assigned_number;

  FOR l IN
    SELECT
      nullif(trim(coalesce(x->>'platform','')), '') AS platform,
      nullif(trim(coalesce(x->>'label','')), '') AS label,
      left(trim(x->>'url'), 500) AS url
    FROM jsonb_array_elements(sub.links) AS x
    WHERE coalesce(length(trim(x->>'url')), 0) > 0
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.aipf_entity_links
      WHERE entity_id = target_entity_id AND url = l.url
    ) THEN
      INSERT INTO public.aipf_entity_links (entity_id, platform, label, url)
      VALUES (target_entity_id, l.platform, l.label, l.url);
    END IF;
  END LOOP;

  UPDATE public.aipf_onboarding_submissions
  SET status = 'approved', reviewer_id = auth.uid(), entity_id = target_entity_id
  WHERE id = sub.id;

  IF inv.member_number IS NULL THEN
    UPDATE public.aipf_invitations SET member_number = assigned_number WHERE id = inv.id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'entity_id', target_entity_id,
    'slug', target_slug,
    'member_number', assigned_number
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aipf_approve_onboarding(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aipf_approve_onboarding(uuid) TO authenticated, service_role;