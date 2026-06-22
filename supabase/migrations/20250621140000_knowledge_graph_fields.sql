-- Phase 15: Knowledge graph — expertise areas, project/content knowledge fields

create table if not exists public.expertise_areas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  summary text,
  why_it_matters text,
  key_takeaways text[] not null default '{}',
  keywords text[] not null default '{}',
  icon_name text,
  featured boolean not null default false,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.expertise_areas is 'CMS-managed expertise domains for knowledge graph and AEO authority pages';

alter table public.projects
  add column if not exists expertise_slugs text[] not null default '{}',
  add column if not exists concepts text[] not null default '{}',
  add column if not exists technologies text[] not null default '{}',
  add column if not exists project_facts jsonb not null default '{}'::jsonb,
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists ai_summary text,
  add column if not exists key_takeaways text[] not null default '{}';

comment on column public.projects.expertise_slugs is 'Slugs referencing expertise_areas.slug';
comment on column public.projects.concepts is 'Knowledge graph concept tags';
comment on column public.projects.technologies is 'Explicit technology tags for knowledge graph linking';
comment on column public.projects.project_facts is 'Structured facts — { role, documents, latency, deployment, ... }';
comment on column public.projects.faq is 'FAQ items — [{ question, answer }]';
comment on column public.projects.ai_summary is 'Machine-readable 2–5 sentence project summary for LLM retrieval';
comment on column public.projects.key_takeaways is 'Bullet takeaways frequently cited by LLMs';

alter table public.content
  add column if not exists expertise_slugs text[] not null default '{}',
  add column if not exists concepts text[] not null default '{}',
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists ai_summary text,
  add column if not exists key_takeaways text[] not null default '{}';

comment on column public.content.faq is 'FAQ items — [{ question, answer }]';

create index if not exists idx_expertise_areas_status_order
  on public.expertise_areas (status, featured desc, display_order asc);

create index if not exists idx_projects_expertise_slugs
  on public.projects using gin (expertise_slugs);

create index if not exists idx_content_expertise_slugs
  on public.content using gin (expertise_slugs);

alter table public.expertise_areas enable row level security;
alter table public.expertise_areas force row level security;

create policy "expertise_areas_public_read"
  on public.expertise_areas
  for select
  to anon, authenticated
  using (status = 'published');

create policy "expertise_areas_admin_all"
  on public.expertise_areas
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.expertise_areas (
  title,
  slug,
  description,
  summary,
  why_it_matters,
  keywords,
  featured,
  display_order,
  status
) values
  (
    'AI Engineering',
    'ai-engineering',
    'Production AI systems, LLM applications, and applied machine learning engineering.',
    'Applied AI engineering across retrieval, agents, and enterprise deployment.',
    'Organizations need production-grade AI systems that are reliable, observable, and grounded in real workflows.',
    array['AI Engineering', 'Applied AI', 'LLM', 'Production Systems'],
    true,
    0,
    'published'
  ),
  (
    'RAG Systems',
    'rag-systems',
    'Retrieval-augmented generation pipelines, hybrid search, and grounding layers.',
    'Hybrid retrieval, reranking, and validation for grounded LLM responses.',
    'RAG reduces hallucinations and connects models to proprietary knowledge bases.',
    array['RAG', 'Retrieval', 'Vector Search', 'Hybrid Search'],
    true,
    1,
    'published'
  ),
  (
    'Multi-Agent Systems',
    'multi-agent-systems',
    'Orchestrated agents, tool use, and workflow specialization.',
    'LangGraph-style orchestration for specialized agent workflows.',
    'Complex tasks benefit from agent specialization, state, and validation layers.',
    array['Multi-Agent', 'LangGraph', 'Orchestration', 'Agents'],
    true,
    2,
    'published'
  ),
  (
    'Document Intelligence',
    'document-intelligence',
    'Parsing, extraction, and understanding of complex documents.',
    'Document pipelines for PDFs, forms, and unstructured enterprise content.',
    'Enterprise knowledge is locked in documents that require intelligent extraction.',
    array['Document Intelligence', 'OCR', 'Extraction', 'PDF'],
    true,
    3,
    'published'
  ),
  (
    'Enterprise Automation',
    'enterprise-automation',
    'Workflow automation, integrations, and AI-assisted operations.',
    'Automation systems that combine rules, APIs, and AI decision layers.',
    'Automation scales expertise and reduces manual operational overhead.',
    array['Automation', 'Workflows', 'Integrations', 'Enterprise'],
    true,
    4,
    'published'
  ),
  (
    'MLOps',
    'mlops',
    'Model deployment, monitoring, and production ML infrastructure.',
    'Operational practices for reliable model serving and evaluation.',
    'Production ML requires observability, versioning, and deployment discipline.',
    array['MLOps', 'Deployment', 'Monitoring', 'SageMaker'],
    false,
    5,
    'published'
  ),
  (
    'Evaluation Systems',
    'evaluation-systems',
    'LLM evaluation, benchmarking, and quality measurement.',
    'Structured evaluation for accuracy, latency, and regression detection.',
    'AI systems need measurable quality gates before production release.',
    array['Evaluation', 'Benchmarks', 'Quality', 'Testing'],
    false,
    6,
    'published'
  ),
  (
    'Vector Search',
    'vector-search',
    'Embeddings, vector stores, and semantic retrieval infrastructure.',
    'Semantic search layers powering RAG and knowledge retrieval.',
    'Vector search enables semantic matching beyond keyword retrieval.',
    array['Vector Search', 'Embeddings', 'Pinecone', 'pgvector'],
    false,
    7,
    'published'
  ),
  (
    'Knowledge Systems',
    'knowledge-systems',
    'Knowledge bases, graphs, and structured information architecture.',
    'Connected knowledge layers for research, documentation, and retrieval.',
    'Knowledge systems make expertise durable, searchable, and reusable.',
    array['Knowledge Base', 'Knowledge Graph', 'Documentation'],
    false,
    8,
    'published'
  ),
  (
    'AI Infrastructure',
    'ai-infrastructure',
    'APIs, serving layers, and platform infrastructure for AI workloads.',
    'FastAPI, cloud, and platform infrastructure for AI applications.',
    'Reliable infrastructure determines latency, cost, and scalability of AI products.',
    array['FastAPI', 'Infrastructure', 'Cloud', 'API'],
    false,
    9,
    'published'
  )
on conflict (slug) do nothing;
