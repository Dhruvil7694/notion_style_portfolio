-- =============================================================================
-- Migration: indexes
-- Description: B-tree and GIN indexes for query and search performance
-- =============================================================================

-- projects
CREATE INDEX idx_projects_slug ON public.projects (slug);
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_featured ON public.projects (featured) WHERE featured = true;
CREATE INDEX idx_projects_published_at ON public.projects (published_at DESC NULLS LAST);
CREATE INDEX idx_projects_search ON public.projects USING gin (search_vector);
CREATE INDEX idx_projects_tech_stack ON public.projects USING gin (tech_stack);

-- content
CREATE INDEX idx_content_type ON public.content (type);
CREATE INDEX idx_content_status ON public.content (status);
CREATE INDEX idx_content_type_status ON public.content (type, status);
CREATE INDEX idx_content_published_at ON public.content (published_at DESC NULLS LAST);
CREATE INDEX idx_content_tags ON public.content USING gin (tags);
CREATE INDEX idx_content_search ON public.content USING gin (search_vector);

-- experience
CREATE INDEX idx_experience_display_order ON public.experience (display_order ASC);
CREATE INDEX idx_experience_start_date ON public.experience (start_date DESC);

-- skills
CREATE INDEX idx_skills_category ON public.skills (category);
CREATE INDEX idx_skills_display_order ON public.skills (display_order ASC);

-- education
CREATE INDEX idx_education_end_date ON public.education (end_date DESC NULLS LAST);

-- resumes
CREATE UNIQUE INDEX idx_resumes_one_active ON public.resumes (is_active)
  WHERE is_active = true;
CREATE INDEX idx_resumes_uploaded_at ON public.resumes (uploaded_at DESC);

-- contact_submissions
CREATE INDEX idx_contact_submissions_created_at
  ON public.contact_submissions (created_at DESC);

-- settings (admin allowlist lookup inside is_admin())
CREATE INDEX idx_settings_key ON public.settings (key);

COMMENT ON INDEX idx_projects_search IS 'GIN full-text search on project title, summary, tech_stack';
COMMENT ON INDEX idx_content_search IS 'GIN full-text search on content title, excerpt, tags';
COMMENT ON INDEX idx_resumes_one_active IS 'Ensures only one active resume at a time';
