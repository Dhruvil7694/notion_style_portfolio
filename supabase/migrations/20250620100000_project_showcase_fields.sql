-- Migration: project_showcase_fields
-- Description: CMS-managed project showcase metadata, Iconify icons, and display ordering

ALTER TABLE public.projects
  ADD COLUMN icon_name text,
  ADD COLUMN tagline text,
  ADD COLUMN year text,
  ADD COLUMN category text,
  ADD COLUMN role text,
  ADD COLUMN project_url text,
  ADD COLUMN cover_image text,
  ADD COLUMN hover_preview_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN display_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_challenge_length,
  DROP CONSTRAINT IF EXISTS projects_solution_length,
  DROP CONSTRAINT IF EXISTS projects_impact_length;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_challenge_length CHECK (
    challenge IS NULL OR char_length(challenge) <= 300
  ),
  ADD CONSTRAINT projects_solution_length CHECK (
    solution IS NULL OR char_length(solution) <= 300
  ),
  ADD CONSTRAINT projects_impact_length CHECK (
    impact IS NULL OR char_length(impact) <= 300
  ),
  ADD CONSTRAINT projects_tagline_length CHECK (
    tagline IS NULL OR char_length(tagline) <= 120
  ),
  ADD CONSTRAINT projects_display_order_positive CHECK (
    display_order >= 0
  ),
  ADD CONSTRAINT projects_icon_name_format CHECK (
    icon_name IS NULL OR icon_name ~ '^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$'
  );

COMMENT ON COLUMN public.projects.icon_name IS 'Iconify identifier, e.g. lucide:brain';
COMMENT ON COLUMN public.projects.tagline IS 'Short project subtitle shown below title';
COMMENT ON COLUMN public.projects.year IS 'Display year for listings, e.g. 2026';
COMMENT ON COLUMN public.projects.category IS 'Project category label, e.g. AI Research';
COMMENT ON COLUMN public.projects.role IS 'Contributor role, e.g. Lead Engineer';
COMMENT ON COLUMN public.projects.project_url IS 'Primary live/demo project URL';
COMMENT ON COLUMN public.projects.cover_image IS 'Cover image URL for featured layouts';
COMMENT ON COLUMN public.projects.hover_preview_enabled IS 'Whether hover preview card is shown';
COMMENT ON COLUMN public.projects.display_order IS 'Manual sort order for homepage listings';

UPDATE public.projects
SET project_url = live_url
WHERE project_url IS NULL AND live_url IS NOT NULL;

WITH ordered AS (
  SELECT id, (row_number() OVER (ORDER BY created_at ASC) - 1)::integer AS ord
  FROM public.projects
)
UPDATE public.projects AS p
SET display_order = ordered.ord
FROM ordered
WHERE p.id = ordered.id;

CREATE INDEX IF NOT EXISTS idx_projects_display_order ON public.projects (display_order);
