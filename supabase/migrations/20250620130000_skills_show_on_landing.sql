ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS show_on_landing boolean NOT NULL DEFAULT false;

-- Existing curated skills were shown on the landing stack before this flag existed.
UPDATE public.skills
SET show_on_landing = true
WHERE show_on_landing = false;

COMMENT ON COLUMN public.skills.show_on_landing IS
  'When true, technology appears in the home page stack showcase. Full /stack lists all published tech regardless.';
