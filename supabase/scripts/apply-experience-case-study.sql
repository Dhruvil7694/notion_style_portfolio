-- =============================================================================
-- Apply experience case_study column (run once in Supabase Dashboard → SQL Editor)
-- Then run: npm run db:seed-experience-case-study
-- Or full re-seed: npm run db:seed
-- =============================================================================

ALTER TABLE public.experience
  ADD COLUMN IF NOT EXISTS case_study jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.experience.case_study IS
  'Structured content for experience detail sections (projects, tradeoffs, impact, etc.)';

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20250625100000',
  '20250625100000_experience_case_study.sql',
  ARRAY[]::text[]
)
ON CONFLICT (version) DO NOTHING;
