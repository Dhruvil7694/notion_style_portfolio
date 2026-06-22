-- =============================================================================
-- Seed: Dhruvil Patel resume sample data
-- Source: AI_Engineer_Dhruvil_Patel.pdf
-- Run via: supabase db reset (local Docker) or npm run db:seed (hosted)
-- =============================================================================

-- Clear prior sample rows (safe on db reset; supports manual re-seed)
DELETE FROM public.content;
DELETE FROM public.experience;
DELETE FROM public.education;
DELETE FROM public.projects;
DELETE FROM public.resumes;

-- Settings
INSERT INTO public.settings (key, value) VALUES
  (
    'site_settings',
    '{
      "site_name": "Dhruvil Patel",
      "site_description": "I build AI systems and automations that need to work after demo day — RAG pipelines, agent workflows, and internal tools. LangChain, LangGraph, FastAPI, and a lot of debugging in between.",
      "bio_secondary": "At 1POINT1 I work on NL-to-SQL and document pipelines; before that, GenAI and compliance tooling at Cyber Security Umbrella. That stretch taught me to care about evals, guardrails, and shipping over slides.",
      "owner_name": "Dhruvil Patel",
      "owner_title": "Applied AI Engineer",
      "owner_avatar": null,
      "status_bubble": "Building production AI systems",
      "experience_summary": "~1.5 years building production AI systems",
      "site_url": "http://localhost:3000"
    }'::jsonb
  ),
  (
    'social_links',
    '{
      "github": "https://github.com/Dhruvil7694",
      "linkedin": "https://www.linkedin.com/in/dhruvilpatel76",
      "twitter": "https://x.com/Dhruvil_7694",
      "instagram": null
    }'::jsonb
  ),
  (
    'contact_info',
    '{
      "email": "dhruvil7694@gmail.com",
      "location": "Pune, India",
      "calendly_url": null
    }'::jsonb
  ),
  (
    'about_content',
    '{
      "intro": "I build AI systems and automations that need to work after demo day — RAG pipelines, agent workflows, and internal tools people actually open on a Monday.",
      "intro_tools": "Most weeks that means LangChain, FastAPI, vector stores, and a lot of time on the unglamorous plumbing.",
      "career_intro": "At 1POINT1 I work on NL-to-SQL and document pipelines; before that, GenAI and compliance tooling at Cyber Security Umbrella.",
      "after_umbrella": "That stretch — shipping under compliance pressure, then production AI — taught me to care about evals, guardrails, and the boring parts that keep systems running. I explore tools hands-on before asking a team to adopt them, and I''d rather ship something small that works than demo something big that doesn''t.",
      "retrieval": "Shipping taught me that getting retrieval right matters more than swapping models — chunk size, evals, and knowing when RAG is the wrong tool changed how I build and how I talk to teams about what''s realistic.",
      "ownership": "I like owning problems end to end: schema design, API contracts, the prompt that breaks at 2am, and the dashboard someone actually opens. Early enough in my career to stay hands-on, far enough in to know when not to over-engineer.",
      "outside": "Outside work I read papers I half understand, break side projects, and follow how teams are actually adopting agents — not just the launch tweets. Composition and curiosity from photography and music still show up in how I think about interfaces and flow.",
      "mcp": "Lately I''ve been exploring what MCP and tool-calling mean for real internal workflows — not as an expert, but as someone figuring it out. If you''re in the same boat, happy to think through it together.",
      "tags": ["Applied AI Engineer", "RAG systems", "Production-first", "Ships over slides", "Agent workflows", "Python & FastAPI"],
      "flip_keywords": ["LangChain", "LangGraph", "Azure OpenAI", "RAG", "FastAPI", "MCP", "NL-to-SQL", "Vector DBs", "Agentic AI", "Python", "PostgreSQL", "Automations"]
    }'::jsonb
  ),
  (
    'admin_allowlist',
    '{
      "emails": ["dhruvil7694@gmail.com"],
      "github_ids": []
    }'::jsonb
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Skills (from resume)
INSERT INTO public.skills (category, name, proficiency, display_order) VALUES
  ('ai_ml', 'Multi-Agent Systems', 'proficient', 1),
  ('ai_ml', 'RAG Pipelines', 'expert', 2),
  ('ai_ml', 'LangGraph', 'proficient', 3),
  ('ai_ml', 'LangChain', 'proficient', 4),
  ('ai_ml', 'OpenAI API', 'expert', 5),
  ('ai_ml', 'Azure OpenAI Service', 'proficient', 6),
  ('ai_ml', 'Azure AI Search', 'proficient', 7),
  ('ai_ml', 'Prompt Engineering', 'expert', 8),
  ('ai_ml', 'LLM Evaluation', 'proficient', 9),
  ('language', 'Python', 'expert', 10),
  ('framework', 'FastAPI', 'proficient', 11),
  ('framework', 'Next.js', 'proficient', 12),
  ('framework', 'React', 'proficient', 13),
  ('language', 'TypeScript', 'proficient', 14),
  ('cloud', 'Azure', 'proficient', 15),
  ('cloud', 'AWS SageMaker', 'proficient', 16),
  ('cloud', 'Supabase', 'proficient', 17),
  ('tool', 'Docker', 'proficient', 18),
  ('tool', 'PostgreSQL', 'proficient', 19),
  ('tool', 'FAISS', 'proficient', 20),
  ('tool', 'Qdrant', 'proficient', 21),
  ('tool', 'MLflow', 'learning', 22),
  ('tool', 'GitHub Actions', 'proficient', 23),
  ('ai_ml', 'Transformers (Hugging Face)', 'proficient', 24),
  ('ai_ml', 'LoRA/QLoRA Fine-tuning', 'proficient', 25),
  ('ai_ml', 'TensorFlow', 'proficient', 26)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  proficiency = EXCLUDED.proficiency,
  display_order = EXCLUDED.display_order;

-- Experience
INSERT INTO public.experience (
  company, role, start_date, end_date, location, description, achievements, tech_stack, display_order
) VALUES
  (
    '1POINT1',
    'AI Engineer',
    '2025-09-01',
    NULL,
    'Pune, India',
    'Building production AI systems including NL-to-SQL platforms, document intelligence workflows, and enterprise automation pipelines.',
    ARRAY[
      'Built NL→SQL platform with schema-aware guardrails enabling non-technical teams to query PostgreSQL, MySQL, and MSSQL via natural language.',
      'Designed hybrid AI document intelligence system extracting 80+ structured fields from enterprise bidding documents using rule-based parsing + selective RAG.',
      'Automated large-scale document workflows via parallel PDF splitting + Google Drive pipeline, processing 1,000+ page files in under 2 minutes.',
      'Delivered computer vision POC for automobile defect classification achieving 85%+ accuracy across 20 job categories.',
      'Designed high-performance concurrent processing pipelines for enterprise automation across large unstructured datasets.'
    ],
    ARRAY['Python', 'FastAPI', 'PostgreSQL', 'Azure OpenAI', 'RAG', 'LangChain'],
    1
  ),
  (
    'Cyber Security Umbrella',
    'AI/ML Engineer',
    '2024-12-01',
    '2025-09-01',
    'Remote',
    'Deployed GenAI and compliance systems for cybersecurity operations, including RAG assistants and fine-tuned LLM workflows.',
    ARRAY[
      'Deployed GenAI real-time assistant handling 82,000+ cybersecurity scenarios using RAG + LangChain + Gemini API — 40% faster incident triage.',
      'Built multi-model compliance system using LoRA/QLoRA fine-tuned LLMs achieving ~95% operational accuracy in regulatory mapping.',
      'Designed SOC analytics pipeline aggregating data from 6+ security tools with real-time ingestion and anomaly detection.',
      'Led cross-functional team of 5 engineers using agile ML workflows, accelerating delivery by 25%.',
      'Deployed scalable solution on AWS SageMaker with auto-scaling FastAPI endpoints handling 1,000+ concurrent requests.'
    ],
    ARRAY['Python', 'FastAPI', 'LangChain', 'AWS SageMaker', 'LoRA/QLoRA', 'RAG'],
    2
  ),
  (
    'SVNIT (NIT Surat)',
    'AI/ML Researcher',
    '2024-05-01',
    '2024-08-01',
    'Surat, India',
    'Research on EEG-based depression detection using deep learning architectures.',
    ARRAY[
      'Designed CNN-LSTM hybrid architecture for EEG-based depression detection achieving 90% accuracy — 15% improvement over state-of-the-art baselines.',
      'Engineered distributed TensorFlow training pipeline on AWS EC2, reducing training time from 12 hours to 7 hours.'
    ],
    ARRAY['Python', 'TensorFlow', 'AWS EC2', 'CNN-LSTM'],
    3
  ),
  (
    'P P Savani University',
    'AI/ML Researcher (Volunteer)',
    '2023-12-01',
    '2024-05-01',
    'Surat, India',
    'Unpaid research internship focused on NLP-based depression detection from social media data.',
    ARRAY[
      'Built end-to-end NLP depression detection system analyzing 20,000+ social media posts with 88.10% accuracy using ensemble methods.',
      'Published peer-reviewed research in ICICC 2024 (Springer LNNS); presented at international conference.'
    ],
    ARRAY['Python', 'NLP', 'Ensemble Methods', 'Feature Engineering'],
    4
  );

-- Education
INSERT INTO public.education (
  institution, degree, start_date, end_date, description, achievements
) VALUES
  (
    'P P Savani University',
    'Bachelor of Information Technology',
    '2021-08-01',
    '2025-05-01',
    'CGPA: 8.5/10 · Gold Medallist. Author of 3 peer-reviewed AI/ML research papers, including ICICC 2024 (Springer LNNS) on large-scale social media depression detection using NLP and ML.',
    ARRAY['Gold Medallist', 'ICICC 2024 publication (Springer LNNS)', '3 peer-reviewed AI/ML research papers']
  );

-- Projects
INSERT INTO public.projects (
  slug, title, summary, content, tech_stack, github_url, live_url, featured, status, published_at
) VALUES
  (
    'bohrai-research-platform',
    'BohrAI — AI Research Automation Platform',
    'Multi-agent research system automating literature discovery, evidence validation, and structured report generation with CLI + API and SSE streaming.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Built an AI-powered research system that automates end-to-end workflows including literature discovery, evidence validation, and structured report generation using multi-agent pipelines."
        },
        {
          "type": "bullet_list",
          "items": [
            "Designed modular architecture combining CLI tool and lightweight API with real-time progress streaming (SSE).",
            "Implemented multi-agent orchestration with specialized sub-agents for literature retrieval, reasoning validation, and citation integrity.",
            "Developed hybrid retrieval pipeline integrating ArXiv, Semantic Scholar, and PubMed with rule-based validation.",
            "Engineered scalable execution with parallel processing, disk-backed state management, and dynamic model routing across LLM providers."
          ]
        }
      ]
    }'::jsonb,
    ARRAY['Python', 'FastAPI', 'LangGraph', 'LangChain', 'SSE', 'Multi-Agent Systems'],
    NULL,
    NULL,
    true,
    'published',
    now() - interval '14 days'
  ),
  (
    'enterprise-file-governance',
    'Enterprise File Governance & AI Assistant Platform',
    'Enterprise platform for monitoring, controlling, and governing sensitive file operations with AI-powered operator assistant and policy-driven automation.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Built an enterprise platform for monitoring, controlling, and governing sensitive file operations across Windows endpoints, integrating real-time telemetry, quarantine workflows, and approval-based deletion systems."
        },
        {
          "type": "bullet_list",
          "items": [
            "Distributed architecture: FastAPI backend, PostgreSQL, Redis rate limiting, Windows agent with local buffering.",
            "AI-powered operator assistant using LLM tool-calling with structured workflows and human-in-the-loop approval.",
            "Streaming APIs (SSE) for real-time chat, event tracking, and long-running operations.",
            "Policy-driven automation with auto-delete scheduler and auditability."
          ]
        }
      ]
    }'::jsonb,
    ARRAY['FastAPI', 'PostgreSQL', 'Redis', 'LLM Tool-Calling', 'SSE', 'RBAC'],
    NULL,
    NULL,
    true,
    'published',
    now() - interval '30 days'
  ),
  (
    'nl-to-sql-platform',
    'NL-to-SQL Enterprise Reporting Platform',
    'Schema-aware natural language interface enabling non-technical teams to query PostgreSQL, MySQL, and MSSQL databases without analyst dependency.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Built at 1POINT1 — an NL→SQL platform with schema-aware guardrails enabling non-technical sales and ops teams to query enterprise databases via natural language, eliminating analyst dependency for reporting and accelerating forecasting workflows."
        },
        {
          "type": "callout",
          "variant": "info",
          "content": "Supports PostgreSQL, MySQL, and MSSQL with validation layers to reduce hallucinations in generated queries."
        }
      ]
    }'::jsonb,
    ARRAY['Python', 'LLM', 'PostgreSQL', 'MySQL', 'MSSQL', 'Azure OpenAI'],
    NULL,
    NULL,
    true,
    'published',
    now() - interval '45 days'
  ),
  (
    'notion-style-portfolio',
    'Notion-Style Portfolio CMS',
    'Production-grade portfolio and knowledge base platform with integrated CMS, rich content blocks, and Supabase backend — this site.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "A Notion-inspired portfolio and content management system designed for AI engineers, featuring rich content blocks, Tiptap editor, and a public knowledge-base frontend."
        },
        {
          "type": "paragraph",
          "content": [
            { "text": "Built with ", "marks": [] },
            { "text": "Next.js", "marks": ["bold"] },
            { "text": ", ", "marks": [] },
            { "text": "Supabase", "marks": ["bold"] },
            { "text": ", and a serializable ", "marks": [] },
            { "text": "ContentDocument", "marks": ["code"] },
            { "text": " architecture for CMS-driven content.", "marks": [] }
          ]
        }
      ]
    }'::jsonb,
    ARRAY['Next.js', 'Supabase', 'TypeScript', 'Tailwind CSS', 'Tiptap'],
    NULL,
    NULL,
    false,
    'published',
    now() - interval '7 days'
  ),
  (
    'genai-cybersecurity-assistant',
    'GenAI Cybersecurity Assistant',
    'Real-time GenAI assistant handling 82,000+ cybersecurity scenarios with RAG and LangChain for faster incident triage.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Deployed at Cyber Security Umbrella — a GenAI real-time assistant handling 82,000+ cybersecurity scenarios using RAG + LangChain + Gemini API, achieving 40% faster incident triage on lightweight infrastructure."
        }
      ]
    }'::jsonb,
    ARRAY['Python', 'LangChain', 'RAG', 'Gemini API', 'FastAPI'],
    NULL,
    NULL,
    false,
    'published',
    now() - interval '90 days'
  );

-- Hover preview fields for project list cards
UPDATE public.projects SET
  challenge = 'Research teams spend hours manually searching papers, validating evidence, and assembling structured reports.',
  solution = 'Multi-agent pipeline with literature retrieval, reasoning validation, and citation checks — exposed via CLI and SSE-streaming API.',
  impact = 'Automates end-to-end research workflows and delivers structured reports with real-time progress visibility.'
WHERE slug = 'bohrai-research-platform';

UPDATE public.projects SET
  challenge = 'Sensitive file operations across Windows endpoints lacked centralized monitoring, policy enforcement, and operator tooling.',
  solution = 'Distributed platform with endpoint agents, policy-driven quarantine workflows, and an LLM operator assistant with human-in-the-loop approvals.',
  impact = 'Gives security teams real-time visibility, auditable governance, and faster incident response across the fleet.'
WHERE slug = 'enterprise-file-governance';

UPDATE public.projects SET
  challenge = 'Sales and ops teams depended on analysts for every database report, slowing forecasting and decision-making.',
  solution = 'Schema-aware NL-to-SQL interface with validation guardrails across PostgreSQL, MySQL, and MSSQL.',
  impact = 'Non-technical teams query enterprise data directly, eliminating analyst bottlenecks for routine reporting.'
WHERE slug = 'nl-to-sql-platform';

UPDATE public.projects SET
  challenge = 'Engineering portfolios often require code deploys for every content change, with no structured CMS for case studies.',
  solution = 'Notion-inspired CMS with rich content blocks, Tiptap editor, and Supabase-backed publishing workflow.',
  impact = 'Content updates ship instantly without redeploys — this site runs on it.'
WHERE slug = 'notion-style-portfolio';

UPDATE public.projects SET
  challenge = 'Security analysts faced 82,000+ scenario types with slow manual triage on lightweight infrastructure.',
  solution = 'RAG-powered GenAI assistant using LangChain and Gemini API for real-time scenario handling.',
  impact = '40% faster incident triage without scaling hardware.'
WHERE slug = 'genai-cybersecurity-assistant';

-- Content: research
INSERT INTO public.content (
  type, slug, title, excerpt, content, tags, status, published_at
) VALUES
  (
    'research',
    'production-rag-system-design',
    'Designing Production RAG Systems That Don''t Hallucinate',
    'Notes on validation layers, hybrid retrieval, and model routing for enterprise RAG pipelines.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Production RAG is not about embedding documents and calling an LLM. It is about building systems that handle failure cases, long-running processing, and real workflow constraints."
        },
        {
          "type": "heading",
          "level": 2,
          "content": "Hybrid retrieval beats pure vector search"
        },
        {
          "type": "paragraph",
          "content": "Combining rule-based parsing with selective RAG retrieval — as used in enterprise document intelligence — reduces hallucinations while maintaining coverage over structured fields."
        },
        {
          "type": "callout",
          "variant": "info",
          "content": "Model routing across providers based on cost, latency, and task complexity is as important as the retrieval pipeline itself."
        }
      ]
    }'::jsonb,
    ARRAY['RAG', 'LLM', 'Production AI'],
    'published',
    now() - interval '20 days'
  ),
  (
    'research',
    'multi-agent-orchestration-patterns',
    'Multi-Agent Orchestration Patterns for Research Automation',
    'Architecture notes from building BohrAI — central runtime, specialized sub-agents, and citation integrity validation.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Multi-agent systems work best when each agent has a narrow, verifiable responsibility. A central runtime coordinates literature retrieval, reasoning validation, and citation integrity as separate concerns."
        },
        {
          "type": "bullet_list",
          "items": [
            "Literature retrieval agent: ArXiv, Semantic Scholar, PubMed integration.",
            "Reasoning validation agent: rule-based checks on evidence-backed outputs.",
            "Citation integrity agent: cross-reference validation before report generation."
          ]
        }
      ]
    }'::jsonb,
    ARRAY['Multi-Agent', 'LangGraph', 'Research Automation'],
    'published',
    now() - interval '35 days'
  );

-- Content: blog / writing
INSERT INTO public.content (
  type, slug, title, excerpt, content, tags, status, published_at
) VALUES
  (
    'blog',
    'from-notebooks-to-production-ai',
    'From Notebooks to Production AI',
    'What changes when you move from Jupyter experiments to systems that non-technical teams depend on daily.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "The gap between a working notebook and a production AI system is larger than most teams expect. It is not just about deployment — it is about guardrails, validation, concurrent processing, and designing for failure."
        },
        {
          "type": "paragraph",
          "content": "At 1POINT1, building an NL-to-SQL platform taught me that schema-aware guardrails matter more than model selection. Non-technical users do not need the smartest model — they need a system that never returns a query that corrupts data."
        }
      ]
    }'::jsonb,
    ARRAY['Production AI', 'Engineering'],
    'published',
    now() - interval '10 days'
  ),
  (
    'blog',
    'llm-cost-optimization-strategies',
    'LLM Cost Optimization Without Sacrificing Quality',
    'Dynamic model routing, token budgeting, and task-specific provider selection in multi-model systems.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Running multiple LLM providers in production — OpenAI, Anthropic, Ollama, vLLM — requires a routing layer that considers cost, latency, and task complexity for each request."
        }
      ]
    }'::jsonb,
    ARRAY['LLM', 'Cost Optimization', 'MLOps'],
    'published',
    now() - interval '25 days'
  );

-- Content: automations
INSERT INTO public.content (
  type, slug, title, excerpt, content, tags, status, published_at
) VALUES
  (
    'automation',
    'document-pipeline-automation',
    'Large-Scale Document Pipeline Automation',
    'Parallel PDF splitting and Google Drive integration processing 1,000+ page files in under 2 minutes.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Enterprise bidding documents often exceed 1,000 pages. Manual review cycles take 1–2 hours per file. A parallel PDF splitting pipeline with Google Drive integration reduced this to under 2 minutes."
        },
        {
          "type": "bullet_list",
          "items": [
            "Parallel PDF splitting with concurrent processing pipelines.",
            "Google Drive integration for automated ingestion and routing.",
            "Hybrid AI extraction: rule-based parsing + selective RAG for 80+ structured fields."
          ]
        }
      ]
    }'::jsonb,
    ARRAY['Automation', 'Document Intelligence', 'PDF'],
    'published',
    now() - interval '15 days'
  ),
  (
    'automation',
    'soc-analytics-ingestion',
    'SOC Analytics Ingestion Pipeline',
    'Real-time data aggregation from 6+ security tools with anomaly detection and automated threat monitoring.',
    '{
      "version": 1,
      "blocks": [
        {
          "type": "paragraph",
          "content": "Built at Cyber Security Umbrella — a SOC analytics pipeline aggregating data from 6+ security tools with real-time ingestion, anomaly detection, and automated threat monitoring."
        }
      ]
    }'::jsonb,
    ARRAY['SOC', 'Automation', 'Security'],
    'published',
    now() - interval '40 days'
  );

-- Resume
INSERT INTO public.resumes (file_path, version, is_active) VALUES
  ('/resume/dhruvil-patel.pdf', 1, true);
