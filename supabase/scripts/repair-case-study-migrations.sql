-- =============================================================================
-- Repair: duplicate migration version 20250620120000 blocked db push.
--
-- Run in Supabase Dashboard → SQL Editor if `npx supabase db push` still fails.
-- Then run: npx supabase db push
-- Then run: npm run db:seed-case-study
-- =============================================================================

-- Record the renamed case-study fields migration (columns already exist on remote).
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20250620125000',
  '20250620125000_project_case_study_fields.sql',
  ARRAY[]::text[]
)
ON CONFLICT (version) DO NOTHING;
