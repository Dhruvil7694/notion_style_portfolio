-- =============================================================================
-- Migration: rls_policies
-- Description: Row Level Security for all public tables
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (Supabase best practice)
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE public.experience FORCE ROW LEVEL SECURITY;
ALTER TABLE public.content FORCE ROW LEVEL SECURITY;
ALTER TABLE public.skills FORCE ROW LEVEL SECURITY;
ALTER TABLE public.education FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.resumes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- projects
-- =============================================================================
CREATE POLICY "projects_public_read_published"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "projects_admin_all"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- experience
-- =============================================================================
CREATE POLICY "experience_public_read"
  ON public.experience
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "experience_admin_all"
  ON public.experience
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- content
-- =============================================================================
CREATE POLICY "content_public_read_published"
  ON public.content
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "content_admin_all"
  ON public.content
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- skills
-- =============================================================================
CREATE POLICY "skills_public_read"
  ON public.skills
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "skills_admin_all"
  ON public.skills
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- education
-- =============================================================================
CREATE POLICY "education_public_read"
  ON public.education
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "education_admin_all"
  ON public.education
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- settings
-- =============================================================================
CREATE POLICY "settings_public_read"
  ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('site_settings', 'social_links', 'contact_info')
  );

CREATE POLICY "settings_admin_all"
  ON public.settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- resumes
-- =============================================================================
CREATE POLICY "resumes_public_read_active"
  ON public.resumes
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "resumes_admin_all"
  ON public.resumes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- contact_submissions
-- =============================================================================
CREATE POLICY "contact_public_insert"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "contact_admin_read"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "contact_admin_update"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contact_admin_delete"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- Policy documentation comments
-- =============================================================================
COMMENT ON POLICY "projects_public_read_published" ON public.projects IS
  'Anonymous and authenticated users can read published projects only';

COMMENT ON POLICY "projects_admin_all" ON public.projects IS
  'Admins (JWT allowlist) have full CRUD on projects';

COMMENT ON POLICY "content_public_read_published" ON public.content IS
  'Public read for published blog, research, automation, publication, note';

COMMENT ON POLICY "contact_public_insert" ON public.contact_submissions IS
  'Anyone can submit contact form messages; cannot read others submissions';

COMMENT ON POLICY "settings_public_read" ON public.settings IS
  'Public can read site_settings, social_links, contact_info only';

COMMENT ON POLICY "resumes_public_read_active" ON public.resumes IS
  'Public can read metadata for the single active resume';

COMMENT ON FUNCTION public.is_admin() IS
  'Checks auth JWT email/sub against settings.admin_allowlist JSON';
