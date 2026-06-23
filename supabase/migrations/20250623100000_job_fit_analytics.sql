-- Phase 7: Job fit / JD analytics (admin dashboard)

CREATE TABLE IF NOT EXISTS job_fit_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'jd_validated',
      'fit_analysis',
      'employer_notify',
      'pdf_export',
      'classification_feedback'
    )
  ),
  content_hash TEXT,
  role_title TEXT,
  fit_score INTEGER CHECK (
    fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)
  ),
  seniority TEXT,
  years_experience_min INTEGER,
  years_experience_max INTEGER,
  document_type TEXT,
  confidence REAL,
  was_valid BOOLEAN,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_fit_analytics_events_type_created_idx
  ON job_fit_analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS job_fit_analytics_events_created_at_idx
  ON job_fit_analytics_events (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS job_fit_analytics_fit_analysis_hash_uidx
  ON job_fit_analytics_events (content_hash)
  WHERE event_type = 'fit_analysis' AND content_hash IS NOT NULL;

ALTER TABLE job_fit_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read job_fit_analytics_events"
  ON job_fit_analytics_events
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin delete job_fit_analytics_events"
  ON job_fit_analytics_events
  FOR DELETE
  USING (is_admin());

CREATE POLICY "Service role full access to job_fit_analytics_events"
  ON job_fit_analytics_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
