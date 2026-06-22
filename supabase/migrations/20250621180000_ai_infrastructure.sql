-- Phase 17.5: AI usage tracking and copilot action history

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('public', 'copilot', 'generation')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_estimate NUMERIC(12, 6) NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS copilot_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_provider_idx ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS copilot_actions_entity_slug_idx ON copilot_actions(entity_slug);
CREATE INDEX IF NOT EXISTS copilot_actions_created_at_idx ON copilot_actions(created_at DESC);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to ai_usage_logs"
  ON ai_usage_logs FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role full access to ai_usage_logs"
  ON ai_usage_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to copilot_actions"
  ON copilot_actions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role full access to copilot_actions"
  ON copilot_actions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
