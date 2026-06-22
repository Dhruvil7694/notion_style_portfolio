-- Security: enforce FORCE ROW LEVEL SECURITY on all tables created after the
-- initial RLS setup migration (20250619100002_rls_policies.sql).
-- Table owners (service role) bypass ENABLE RLS unless FORCE is also set.

-- Knowledge graph: expertise_areas
ALTER TABLE public.expertise_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expertise_areas FORCE ROW LEVEL SECURITY;

-- Knowledge graph registries
ALTER TABLE public.technology_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technology_registry FORCE ROW LEVEL SECURITY;

ALTER TABLE public.concept_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_registry FORCE ROW LEVEL SECURITY;

-- Chat
ALTER TABLE public.chat_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;

-- AI infrastructure
ALTER TABLE public.ai_usage_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_actions FORCE ROW LEVEL SECURITY;

-- RLS policies for new tables (allow admin full access, block anonymous)

-- expertise_areas
CREATE POLICY "Admin full access" ON public.expertise_areas
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));

CREATE POLICY "Public read published" ON public.expertise_areas
  FOR SELECT TO anon
  USING (status = 'published');

-- technology_registry
CREATE POLICY "Admin full access" ON public.technology_registry
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));

CREATE POLICY "Public read published" ON public.technology_registry
  FOR SELECT TO anon
  USING (status = 'published');

-- concept_registry
CREATE POLICY "Admin full access" ON public.concept_registry
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));

CREATE POLICY "Public read published" ON public.concept_registry
  FOR SELECT TO anon
  USING (status = 'published');

-- chat_sessions (admin only — no public access)
CREATE POLICY "Admin full access" ON public.chat_sessions
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));

-- chat_messages (admin only)
CREATE POLICY "Admin full access" ON public.chat_messages
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));

-- ai_usage_logs (admin only)
CREATE POLICY "Admin full access" ON public.ai_usage_logs
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));

-- copilot_actions (admin only)
CREATE POLICY "Admin full access" ON public.copilot_actions
  FOR ALL TO authenticated
  USING (auth.email() = current_setting('app.admin_email', true))
  WITH CHECK (auth.email() = current_setting('app.admin_email', true));
