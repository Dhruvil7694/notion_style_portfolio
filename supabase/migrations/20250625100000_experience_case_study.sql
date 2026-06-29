-- Structured case-study content for experience detail accordion sections
ALTER TABLE public.experience
  ADD COLUMN IF NOT EXISTS case_study jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.experience.case_study IS
  'Structured content for experience detail sections (projects, tradeoffs, impact, etc.)';
