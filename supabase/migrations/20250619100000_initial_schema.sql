-- =============================================================================
-- Migration: initial_schema
-- Description: Extensions, enums, helper functions, and core tables
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE public.content_type AS ENUM (
  'blog',
  'research',
  'automation',
  'publication',
  'note'
);

CREATE TYPE public.skill_category AS ENUM (
  'language',
  'framework',
  'tool',
  'cloud',
  'ai_ml',
  'soft',
  'other'
);

CREATE TYPE public.skill_proficiency AS ENUM ('learning', 'proficient', 'expert');

-- Helper: slug format validation
CREATE OR REPLACE FUNCTION public.is_valid_slug(slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$';
$$;

-- Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Helper: admin check via settings allowlist (bypasses RLS for allowlist lookup)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowlist jsonb;
  jwt_email text;
  jwt_sub text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  PERFORM set_config('row_security', 'off', true);

  SELECT value INTO allowlist
  FROM public.settings
  WHERE key = 'admin_allowlist';

  PERFORM set_config('row_security', 'on', true);

  IF allowlist IS NULL THEN
    RETURN false;
  END IF;

  jwt_email := auth.jwt() ->> 'email';
  jwt_sub := auth.jwt() ->> 'sub';

  IF jwt_email IS NOT NULL
    AND allowlist -> 'emails' ? jwt_email THEN
    RETURN true;
  END IF;

  IF jwt_sub IS NOT NULL
    AND allowlist -> 'github_ids' ? jwt_sub THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Helper: immutable search vectors for GENERATED columns (inline to_tsvector/setweight is STABLE on Supabase)
CREATE OR REPLACE FUNCTION public.build_project_search_vector(
  p_title text,
  p_summary text,
  p_tech_stack text[]
)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(p_title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(p_summary, '')), 'B')
    || setweight(
      to_tsvector('simple', coalesce(array_to_string(p_tech_stack, ' '), '')),
      'C'
    );
$$;

CREATE OR REPLACE FUNCTION public.build_content_search_vector(
  p_title text,
  p_excerpt text,
  p_tags text[]
)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(p_title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(p_excerpt, '')), 'B')
    || setweight(
      to_tsvector('simple', coalesce(array_to_string(p_tags, ' '), '')),
      'C'
    );
$$;

-- =============================================================================
-- projects
-- =============================================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  tech_stack text[] NOT NULL DEFAULT '{}'::text[],
  github_url text,
  live_url text,
  featured boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'draft',
  seo_title text,
  seo_description text,
  search_vector tsvector GENERATED ALWAYS AS (
    public.build_project_search_vector(title, summary, tech_stack)
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT projects_slug_valid CHECK (public.is_valid_slug(slug)),
  CONSTRAINT projects_slug_unique UNIQUE (slug),
  CONSTRAINT projects_title_length CHECK (char_length(title) <= 200),
  CONSTRAINT projects_summary_length CHECK (char_length(summary) <= 500),
  CONSTRAINT projects_seo_title_length CHECK (
    seo_title IS NULL OR char_length(seo_title) <= 70
  ),
  CONSTRAINT projects_seo_description_length CHECK (
    seo_description IS NULL OR char_length(seo_description) <= 160
  ),
  CONSTRAINT projects_published_requires_date CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- experience
-- =============================================================================
CREATE TABLE public.experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  role text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  location text,
  description text,
  achievements text[] NOT NULL DEFAULT '{}'::text[],
  tech_stack text[] NOT NULL DEFAULT '{}'::text[],
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT experience_date_order CHECK (
    end_date IS NULL OR end_date >= start_date
  )
);

CREATE TRIGGER experience_updated_at
  BEFORE UPDATE ON public.experience
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- content (unified)
-- =============================================================================
CREATE TABLE public.content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.content_type NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  featured_image text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  status public.content_status NOT NULL DEFAULT 'draft',
  seo_title text,
  seo_description text,
  search_vector tsvector GENERATED ALWAYS AS (
    public.build_content_search_vector(title, excerpt, tags)
  ) STORED,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_type_slug_unique UNIQUE (type, slug),
  CONSTRAINT content_slug_valid CHECK (public.is_valid_slug(slug)),
  CONSTRAINT content_title_length CHECK (char_length(title) <= 200),
  CONSTRAINT content_excerpt_length CHECK (
    excerpt IS NULL OR char_length(excerpt) <= 500
  ),
  CONSTRAINT content_seo_title_length CHECK (
    seo_title IS NULL OR char_length(seo_title) <= 70
  ),
  CONSTRAINT content_seo_description_length CHECK (
    seo_description IS NULL OR char_length(seo_description) <= 160
  ),
  CONSTRAINT content_published_requires_date CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- skills
-- =============================================================================
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.skill_category NOT NULL,
  name text NOT NULL,
  proficiency public.skill_proficiency,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skills_name_unique UNIQUE (name)
);

-- =============================================================================
-- education
-- =============================================================================
CREATE TABLE public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution text NOT NULL,
  degree text NOT NULL,
  start_date date,
  end_date date,
  description text,
  achievements text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT education_date_order CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

CREATE TRIGGER education_updated_at
  BEFORE UPDATE ON public.education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- settings
-- =============================================================================
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- resumes
-- =============================================================================
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resumes_version_positive CHECK (version > 0)
);

-- =============================================================================
-- contact_submissions
-- =============================================================================
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_name_length CHECK (char_length(name) <= 200),
  CONSTRAINT contact_subject_length CHECK (
    subject IS NULL OR char_length(subject) <= 200
  ),
  CONSTRAINT contact_message_length CHECK (char_length(message) <= 5000),
  CONSTRAINT contact_email_format CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Grants for API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.experience TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.education TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

COMMENT ON TABLE public.projects IS 'Portfolio case studies and engineering projects';
COMMENT ON TABLE public.experience IS 'Employment timeline entries';
COMMENT ON TABLE public.content IS 'Unified content: blog, research, automation, publication, note';
COMMENT ON TABLE public.skills IS 'Canonical skill taxonomy';
COMMENT ON TABLE public.education IS 'Degrees and certifications';
COMMENT ON TABLE public.settings IS 'Key-value site configuration';
COMMENT ON TABLE public.resumes IS 'Generated resume PDF artifacts';
COMMENT ON TABLE public.contact_submissions IS 'Inbound contact form messages';
