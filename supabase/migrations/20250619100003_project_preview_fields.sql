-- Hover preview fields for project list cards (Challenge / Solution / Impact)
ALTER TABLE public.projects
  ADD COLUMN challenge text,
  ADD COLUMN solution text,
  ADD COLUMN impact text;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_challenge_length CHECK (
    challenge IS NULL OR char_length(challenge) <= 400
  ),
  ADD CONSTRAINT projects_solution_length CHECK (
    solution IS NULL OR char_length(solution) <= 400
  ),
  ADD CONSTRAINT projects_impact_length CHECK (
    impact IS NULL OR char_length(impact) <= 400
  );

COMMENT ON COLUMN public.projects.challenge IS 'Short problem statement for hover preview cards';
COMMENT ON COLUMN public.projects.solution IS 'How the project solves the challenge — hover preview';
COMMENT ON COLUMN public.projects.impact IS 'Real-world outcome or benefit — hover preview';
