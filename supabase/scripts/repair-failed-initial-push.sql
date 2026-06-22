-- =============================================================================
-- Repair script: run ONCE in Supabase SQL Editor if db push failed mid-migration.
--
-- Dashboard → SQL Editor → New query → paste → Run
-- Then re-run: npx supabase db push
-- =============================================================================

DROP FUNCTION IF EXISTS public.build_content_search_vector(text, text, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.build_project_search_vector(text, text, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_valid_slug(text) CASCADE;

DROP TYPE IF EXISTS public.skill_proficiency CASCADE;
DROP TYPE IF EXISTS public.skill_category CASCADE;
DROP TYPE IF EXISTS public.content_type CASCADE;
DROP TYPE IF EXISTS public.content_status CASCADE;
