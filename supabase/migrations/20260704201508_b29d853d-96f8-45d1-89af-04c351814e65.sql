
-- ============================================================
-- AI People Foundation (AIPF) schema
-- All tables prefixed with aipf_
-- ============================================================

-- Shared updated_at trigger (create only if missing)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- Role enum + user_roles table (roles live in a SEPARATE table)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.aipf_app_role AS ENUM ('admin', 'reviewer', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE public.aipf_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.aipf_profiles TO authenticated;
GRANT ALL ON public.aipf_profiles TO service_role;
ALTER TABLE public.aipf_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_profiles self read" ON public.aipf_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "aipf_profiles self upsert" ON public.aipf_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "aipf_profiles self update" ON public.aipf_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.aipf_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.aipf_app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.aipf_user_roles TO authenticated;
GRANT ALL ON public.aipf_user_roles TO service_role;
ALTER TABLE public.aipf_user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role checks
CREATE OR REPLACE FUNCTION public.aipf_has_role(_user_id uuid, _role public.aipf_app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.aipf_user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.aipf_is_admin_or_reviewer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.aipf_user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','reviewer')
  );
$$;

CREATE POLICY "aipf_user_roles self read" ON public.aipf_user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.aipf_is_admin_or_reviewer());
CREATE POLICY "aipf_user_roles admin manage" ON public.aipf_user_roles
  FOR ALL TO authenticated
  USING (public.aipf_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.aipf_has_role(auth.uid(), 'admin'));

-- ============================================================
-- Entities
-- ============================================================
CREATE TABLE public.aipf_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  entity_name text NOT NULL,
  creator_studio_name text,
  country_region text,
  category text,
  bio text,
  official_image_url text,
  logo_url text,
  year_launched int,
  follower_count text,
  member_type text,
  member_number text UNIQUE,
  founding_cohort boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified',
  status_note text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aipf_entities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_entities TO authenticated;
GRANT ALL ON public.aipf_entities TO service_role;
ALTER TABLE public.aipf_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_entities public read published" ON public.aipf_entities
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "aipf_entities admin all" ON public.aipf_entities
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());
CREATE TRIGGER trg_aipf_entities_updated_at
  BEFORE UPDATE ON public.aipf_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Entity links
-- ============================================================
CREATE TABLE public.aipf_entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.aipf_entities(id) ON DELETE CASCADE,
  platform text,
  label text,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','broken','replaced','archived')),
  priority int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  show_publicly boolean NOT NULL DEFAULT true,
  last_checked timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aipf_entity_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_entity_links TO authenticated;
GRANT ALL ON public.aipf_entity_links TO service_role;
ALTER TABLE public.aipf_entity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_entity_links public read" ON public.aipf_entity_links
  FOR SELECT TO anon, authenticated
  USING (
    show_publicly = true
    AND status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.aipf_entities e
      WHERE e.id = aipf_entity_links.entity_id AND e.published = true
    )
  );
CREATE POLICY "aipf_entity_links admin all" ON public.aipf_entity_links
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());
CREATE TRIGGER trg_aipf_entity_links_updated_at
  BEFORE UPDATE ON public.aipf_entity_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Entity achievements
-- ============================================================
CREATE TABLE public.aipf_entity_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.aipf_entities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  year text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aipf_entity_achievements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_entity_achievements TO authenticated;
GRANT ALL ON public.aipf_entity_achievements TO service_role;
ALTER TABLE public.aipf_entity_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_achievements public read" ON public.aipf_entity_achievements
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.aipf_entities e
    WHERE e.id = aipf_entity_achievements.entity_id AND e.published = true
  ));
CREATE POLICY "aipf_achievements admin all" ON public.aipf_entity_achievements
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());

-- ============================================================
-- Interest submissions
-- ============================================================
CREATE TABLE public.aipf_interest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name text NOT NULL,
  creator_studio_name text NOT NULL,
  contact_name text,
  contact_email text,
  country_region text,
  category text,
  year_launched int,
  main_platform_link text,
  additional_links text,
  follower_count text,
  short_bio text,
  why_include text,
  ai_native_explanation text,
  official_image_url text,
  logo_url text,
  authorized boolean NOT NULL DEFAULT false,
  understands_no_guarantee boolean NOT NULL DEFAULT false,
  newsletter_opt_in boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.aipf_interest_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_interest_submissions TO authenticated;
GRANT ALL ON public.aipf_interest_submissions TO service_role;
ALTER TABLE public.aipf_interest_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_interest public insert" ON public.aipf_interest_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "aipf_interest admin all" ON public.aipf_interest_submissions
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());
CREATE TRIGGER trg_aipf_interest_updated_at
  BEFORE UPDATE ON public.aipf_interest_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Nominations
-- ============================================================
CREATE TABLE public.aipf_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_entity_name text NOT NULL,
  creator_studio_name text,
  social_links text,
  category text,
  country_region text,
  why_considered text,
  nominated_by_name text,
  nominated_by_email text,
  supporting_links text,
  optional_notes text,
  good_faith boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.aipf_nominations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_nominations TO authenticated;
GRANT ALL ON public.aipf_nominations TO service_role;
ALTER TABLE public.aipf_nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_nominations public insert" ON public.aipf_nominations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "aipf_nominations admin all" ON public.aipf_nominations
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());
CREATE TRIGGER trg_aipf_nominations_updated_at
  BEFORE UPDATE ON public.aipf_nominations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Invitations
-- ============================================================
CREATE TABLE public.aipf_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.aipf_entities(id) ON DELETE SET NULL,
  interest_submission_id uuid REFERENCES public.aipf_interest_submissions(id) ON DELETE SET NULL,
  email text,
  invitation_code text UNIQUE NOT NULL,
  member_number text,
  member_type text,
  status text NOT NULL DEFAULT 'drafted',
  sent_at timestamptz,
  accepted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_invitations TO authenticated;
GRANT ALL ON public.aipf_invitations TO service_role;
ALTER TABLE public.aipf_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_invitations admin all" ON public.aipf_invitations
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());

-- ============================================================
-- Broken link reports
-- ============================================================
CREATE TABLE public.aipf_broken_link_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.aipf_entities(id) ON DELETE CASCADE,
  entity_link_id uuid REFERENCES public.aipf_entity_links(id) ON DELETE SET NULL,
  reporter_email text,
  issue_type text,
  message text,
  resolved boolean NOT NULL DEFAULT false,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.aipf_broken_link_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_broken_link_reports TO authenticated;
GRANT ALL ON public.aipf_broken_link_reports TO service_role;
ALTER TABLE public.aipf_broken_link_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_reports public insert" ON public.aipf_broken_link_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "aipf_reports admin all" ON public.aipf_broken_link_reports
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());

-- ============================================================
-- Journal posts
-- ============================================================
CREATE TABLE public.aipf_journal_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  post_type text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aipf_journal_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_journal_posts TO authenticated;
GRANT ALL ON public.aipf_journal_posts TO service_role;
ALTER TABLE public.aipf_journal_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_journal public read published" ON public.aipf_journal_posts
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "aipf_journal admin all" ON public.aipf_journal_posts
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());
CREATE TRIGGER trg_aipf_journal_updated_at
  BEFORE UPDATE ON public.aipf_journal_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Contact messages
-- ============================================================
CREATE TABLE public.aipf_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  subject text,
  category text,
  message text,
  resolved boolean NOT NULL DEFAULT false,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.aipf_contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aipf_contact_messages TO authenticated;
GRANT ALL ON public.aipf_contact_messages TO service_role;
ALTER TABLE public.aipf_contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aipf_contact public insert" ON public.aipf_contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "aipf_contact admin all" ON public.aipf_contact_messages
  FOR ALL TO authenticated
  USING (public.aipf_is_admin_or_reviewer())
  WITH CHECK (public.aipf_is_admin_or_reviewer());

-- ============================================================
-- Auto-create aipf_profiles on new auth.users signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.aipf_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.aipf_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_aipf ON auth.users;
CREATE TRIGGER on_auth_user_created_aipf
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.aipf_handle_new_user();
