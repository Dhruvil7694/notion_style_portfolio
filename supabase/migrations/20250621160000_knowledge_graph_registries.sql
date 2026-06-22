-- Phase 15b: Technology registry, concept registry, expertise relationships

create table if not exists public.technology_registry (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  summary text,
  category text,
  website_url text,
  documentation_url text,
  featured boolean not null default false,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.technology_registry is 'CMS-managed technology knowledge hubs';

create table if not exists public.concept_registry (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  summary text,
  why_it_matters text,
  related_concept_slugs text[] not null default '{}',
  related_expertise_slugs text[] not null default '{}',
  featured boolean not null default false,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.concept_registry is 'CMS-managed concept authority pages for GEO';

alter table public.expertise_areas
  add column if not exists related_expertise_slugs text[] not null default '{}';

comment on column public.expertise_areas.related_expertise_slugs is 'Related expertise domain slugs for knowledge graph edges';

create index if not exists idx_technology_registry_status_order
  on public.technology_registry (status, featured desc, display_order asc);

create index if not exists idx_concept_registry_status_order
  on public.concept_registry (status, featured desc, display_order asc);

alter table public.technology_registry enable row level security;
alter table public.technology_registry force row level security;

alter table public.concept_registry enable row level security;
alter table public.concept_registry force row level security;

create policy "technology_registry_public_read"
  on public.technology_registry
  for select
  to anon, authenticated
  using (status = 'published');

create policy "technology_registry_admin_all"
  on public.technology_registry
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "concept_registry_public_read"
  on public.concept_registry
  for select
  to anon, authenticated
  using (status = 'published');

create policy "concept_registry_admin_all"
  on public.concept_registry
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed technology hubs
insert into public.technology_registry (
  title, slug, description, summary, category, website_url, documentation_url, featured, display_order, status
) values
  (
    'LangGraph',
    'langgraph',
    'Graph-based orchestration framework for building stateful multi-agent LLM workflows.',
    'LangGraph provides persistent state, branching, and human-in-the-loop patterns for production agent systems.',
    'Orchestration',
    'https://langchain-ai.github.io/langgraph/',
    'https://langchain-ai.github.io/langgraph/',
    true,
    1,
    'published'
  ),
  (
    'FastAPI',
    'fastapi',
    'High-performance Python API framework used for AI backend services.',
    'FastAPI powers typed REST APIs with async support for LLM inference and RAG pipelines.',
    'Backend',
    'https://fastapi.tiangolo.com/',
    'https://fastapi.tiangolo.com/',
    true,
    2,
    'published'
  ),
  (
    'PostgreSQL',
    'postgresql',
    'Relational database with pgvector support for hybrid retrieval and metadata storage.',
    'PostgreSQL stores documents, embeddings, and structured metadata in production RAG systems.',
    'Database',
    'https://www.postgresql.org/',
    'https://www.postgresql.org/docs/',
    true,
    3,
    'published'
  ),
  (
    'Supabase',
    'supabase',
    'Open-source Firebase alternative built on PostgreSQL with auth, storage, and realtime.',
    'Supabase provides managed Postgres, RLS, and storage for portfolio and AI application backends.',
    'Platform',
    'https://supabase.com/',
    'https://supabase.com/docs',
    false,
    4,
    'published'
  )
on conflict (slug) do nothing;

-- Seed concept authority pages
insert into public.concept_registry (
  title, slug, description, summary, why_it_matters, related_expertise_slugs, featured, display_order, status
) values
  (
    'Hybrid Retrieval',
    'hybrid-retrieval',
    'Combining dense vector search with sparse keyword retrieval for improved recall and precision.',
    'Hybrid retrieval balances semantic similarity and exact keyword matches in RAG pipelines.',
    'Vector-only search misses exact terminology; keyword-only search misses paraphrases. Hybrid retrieval addresses both failure modes.',
    array['rag-systems', 'vector-search'],
    true,
    1,
    'published'
  ),
  (
    'Citation Validation',
    'citation-validation',
    'Verifying that generated claims map to source documents before surfacing answers.',
    'Citation validation reduces hallucinations by enforcing evidence-backed responses.',
    'LLMs confidently cite nonexistent sources. Validation layers enforce grounding before user-facing output.',
    array['rag-systems', 'evaluation-systems', 'document-intelligence'],
    true,
    2,
    'published'
  ),
  (
    'Agent Memory',
    'agent-memory',
    'Persistent state and context retention across multi-step agent workflows.',
    'Agent memory enables specialized agents to share context and resume long-running tasks.',
    'Stateless agents lose context between steps. Memory enables branching workflows and task specialization.',
    array['multi-agent-systems', 'ai-infrastructure'],
    true,
    3,
    'published'
  )
on conflict (slug) do nothing;

-- Expertise → Expertise relationships
update public.expertise_areas
set related_expertise_slugs = array['vector-search', 'document-intelligence', 'multi-agent-systems', 'evaluation-systems']
where slug = 'rag-systems';

update public.expertise_areas
set related_expertise_slugs = array['rag-systems', 'ai-infrastructure', 'evaluation-systems']
where slug = 'multi-agent-systems';

update public.expertise_areas
set related_expertise_slugs = array['rag-systems', 'knowledge-systems', 'enterprise-automation']
where slug = 'document-intelligence';

update public.expertise_areas
set related_expertise_slugs = array['vector-search', 'rag-systems']
where slug = 'evaluation-systems';

update public.expertise_areas
set related_expertise_slugs = array['rag-systems', 'ai-infrastructure']
where slug = 'vector-search';
