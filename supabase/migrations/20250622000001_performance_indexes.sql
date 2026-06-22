-- Performance indexes: composite and GIN indexes missing from initial migrations
-- CONCURRENTLY omitted — Supabase migrations run inside transactions.

-- chat_messages: paginated history queries filter by session then sort by time.
-- Composite index satisfies ORDER BY created_at DESC without a separate sort.
CREATE INDEX IF NOT EXISTS chat_messages_session_id_created_at_idx
  ON public.chat_messages (session_id, created_at DESC);

-- copilot_actions: approval queue polls WHERE status = 'pending'.
-- No status index exists; without it every queue read full-scans the table.
CREATE INDEX IF NOT EXISTS copilot_actions_status_idx
  ON public.copilot_actions (status);

-- ai_usage_logs: admin cost dashboard filters by provider AND date range.
-- Composite index covers both predicates in one scan.
CREATE INDEX IF NOT EXISTS ai_usage_logs_provider_created_at_idx
  ON public.ai_usage_logs (provider, created_at DESC);

-- concept_registry: related_concept_slugs is text[] — GIN required for
-- ANY / @> / overlap operators used in knowledge graph traversal.
CREATE INDEX IF NOT EXISTS idx_concept_registry_related_concept_slugs
  ON public.concept_registry USING GIN (related_concept_slugs);

-- expertise_areas: keywords is text[] — GIN enables fast containment
-- and overlap queries used for search and graph traversal.
CREATE INDEX IF NOT EXISTS idx_expertise_areas_keywords
  ON public.expertise_areas USING GIN (keywords);
