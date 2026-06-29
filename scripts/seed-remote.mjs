#!/usr/bin/env node
/**
 * Seeds the linked Supabase project with resume sample data.
 * Uses SUPABASE_SECRET_KEY from .env.local (no Supabase CLI required).
 *
 * Usage: npm run db:seed
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

import { EXPERIENCE_CASE_STUDY_BY_COMPANY } from "./experience-case-study-data.mjs"

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return null
  const separatorIndex = trimmed.indexOf("=")
  if (separatorIndex <= 0) return null
  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

function loadEnv() {
  const values = {}
  for (const name of [".env.local", ".env"]) {
    const envPath = resolve(process.cwd(), name)
    if (!existsSync(envPath)) continue
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const parsed = parseEnvLine(line)
      if (parsed) values[parsed.key] = parsed.value
    }
  }
  return values
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local"
  )
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function clearTable(table) {
  const { error } = await supabase
    .from(table)
    .delete()
    .gte("created_at", "1970-01-01T00:00:00Z")
  if (error) {
    throw new Error(`Failed to clear ${table}: ${error.message}`)
  }
}

const settings = [
  {
    key: "site_settings",
    value: {
      site_name: "Dhruvil Patel",
      site_description:
        "I build AI systems and automations that need to work after demo day — RAG pipelines, agent workflows, and internal tools. LangChain, LangGraph, FastAPI, and a lot of debugging in between.",
      bio_secondary:
        "At 1POINT1 I work on NL-to-SQL and document pipelines; before that, GenAI and compliance tooling at Cyber Security Umbrella. That stretch taught me to care about evals, guardrails, and shipping over slides.",
      owner_name: "Dhruvil Patel",
      owner_title: "Applied AI Engineer",
      owner_avatar: null,
      status_bubble: "Building production AI systems",
      experience_summary: "~1.5 years building production AI systems",
      site_url: env.SITE_URL ?? "http://localhost:3000",
    },
  },
  {
    key: "social_links",
    value: {
      github: "https://github.com/Dhruvil7694",
      linkedin: "https://www.linkedin.com/in/dhruvilpatel76",
      twitter: "https://x.com/Dhruvil_7694",
      instagram: null,
    },
  },
  {
    key: "contact_info",
    value: {
      email: "dhruvil7694@gmail.com",
      location: "Pune, India",
      calendly_url: null,
    },
  },
  {
    key: "admin_allowlist",
    value: {
      emails: [env.ADMIN_EMAIL ?? "dhruvil7694@gmail.com"],
      github_ids: [],
    },
  },
]

const skills = [
  ["ai_ml", "Multi-Agent Systems", "proficient", 1],
  ["ai_ml", "RAG Pipelines", "expert", 2],
  ["ai_ml", "LangGraph", "proficient", 3],
  ["ai_ml", "LangChain", "proficient", 4],
  ["ai_ml", "OpenAI API", "expert", 5],
  ["ai_ml", "Azure OpenAI Service", "proficient", 6],
  ["ai_ml", "Azure AI Search", "proficient", 7],
  ["ai_ml", "Prompt Engineering", "expert", 8],
  ["ai_ml", "LLM Evaluation", "proficient", 9],
  ["language", "Python", "expert", 10],
  ["framework", "FastAPI", "proficient", 11],
  ["framework", "Next.js", "proficient", 12],
  ["framework", "React", "proficient", 13],
  ["language", "TypeScript", "proficient", 14],
  ["cloud", "Azure", "proficient", 15],
  ["cloud", "AWS SageMaker", "proficient", 16],
  ["cloud", "Supabase", "proficient", 17],
  ["tool", "Docker", "proficient", 18],
  ["tool", "PostgreSQL", "proficient", 19],
  ["tool", "FAISS", "proficient", 20],
  ["tool", "Qdrant", "proficient", 21],
  ["tool", "MLflow", "learning", 22],
  ["tool", "GitHub Actions", "proficient", 23],
  ["ai_ml", "Transformers (Hugging Face)", "proficient", 24],
  ["ai_ml", "LoRA/QLoRA Fine-tuning", "proficient", 25],
  ["ai_ml", "TensorFlow", "proficient", 26],
].map(([category, name, proficiency, display_order]) => ({
  category,
  name,
  proficiency,
  display_order,
}))

const experience = [
  {
    company: "1POINT1",
    role: "AI Engineer",
    start_date: "2025-09-01",
    end_date: null,
    location: "Pune, India",
    description:
      "Building production AI systems including NL-to-SQL platforms, document intelligence workflows, and enterprise automation pipelines.",
    achievements: [
      "Built NL→SQL platform with schema-aware guardrails enabling non-technical sales and ops teams to query PostgreSQL, MySQL, and MSSQL via natural language — eliminating analyst dependency for enterprise reporting and accelerating forecasting workflows.",
      "Designed hybrid AI document intelligence system extracting 80+ structured fields from enterprise bidding documents using rule-based parsing + selective RAG; reduced contract review cycle time and improved deal visibility.",
      "Automated large-scale document workflows via parallel PDF splitting + Google Drive pipeline, processing 1,000+ page files in under 2 minutes vs. 1–2 hours manually — freeing sales teams from administrative overhead.",
      "Delivered computer vision POC for automobile defect classification achieving 85%+ accuracy across 20 job categories under varied real-world conditions.",
      "Designed high-performance concurrent processing pipelines for enterprise automation, optimizing latency and throughput across large unstructured datasets.",
    ],
    tech_stack: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "MySQL",
      "MSSQL",
      "Azure OpenAI",
      "Azure AI Search",
      "LangChain",
      "LangGraph",
      "RAG",
      "Docker",
    ],
    case_study: EXPERIENCE_CASE_STUDY_BY_COMPANY["1POINT1"],
    display_order: 1,
  },
  {
    company: "Cyber Security Umbrella",
    role: "AI/ML Engineer",
    start_date: "2024-12-01",
    end_date: "2025-09-01",
    location: "Remote",
    description:
      "Deployed GenAI and compliance systems for cybersecurity operations, including RAG assistants and fine-tuned LLM workflows.",
    achievements: [
      "Deployed GenAI real-time assistant handling 82,000+ cybersecurity scenarios using RAG + LangChain + Gemini API — 40% faster incident triage vs. manual lookup, on lightweight infrastructure with no external API dependency for core inference.",
      "Built multi-model compliance system using LoRA/QLoRA fine-tuned LLMs achieving ~95% operational accuracy in regulatory mapping and gap reasoning — directly comparable to AI-driven sales qualification and competitive intelligence workflows.",
      "Designed SOC analytics pipeline aggregating data from 6+ security tools with real-time ingestion, anomaly detection, and automated threat monitoring; demonstrates full-stack AI forecasting architecture applicable to sales performance monitoring.",
      "Led cross-functional team of 5 engineers using agile ML workflows and automated testing, accelerating delivery by 25%; regularly communicated complex AI capabilities to non-technical executive stakeholders.",
      "Deployed scalable solution on AWS SageMaker with auto-scaling FastAPI endpoints handling 1,000+ concurrent requests.",
    ],
    tech_stack: [
      "Python",
      "FastAPI",
      "LangChain",
      "RAG",
      "Gemini API",
      "LoRA/QLoRA",
      "Hugging Face Transformers",
      "AWS SageMaker",
      "Docker",
      "PostgreSQL",
    ],
    case_study: EXPERIENCE_CASE_STUDY_BY_COMPANY["Cyber Security Umbrella"],
    display_order: 2,
  },
  {
    company: "SVNIT (NIT Surat)",
    role: "AI/ML Researcher",
    start_date: "2024-05-01",
    end_date: "2024-08-01",
    location: "Surat, India",
    description:
      "Research on EEG-based depression detection using deep learning architectures.",
    achievements: [
      "Designed CNN-LSTM hybrid architecture for EEG-based depression detection achieving 90% accuracy — 15% improvement over state-of-the-art baselines.",
      "Engineered distributed TensorFlow training pipeline on AWS EC2 cluster, reducing training time from 12 hours to 7 hours through parallel processing and memory optimization.",
    ],
    tech_stack: [
      "Python",
      "TensorFlow",
      "AWS EC2",
      "CNN-LSTM",
      "EEG signal processing",
    ],
    case_study: EXPERIENCE_CASE_STUDY_BY_COMPANY["SVNIT (NIT Surat)"],
    display_order: 3,
  },
  {
    company: "P P Savani University",
    role: "AI/ML Researcher (Volunteer)",
    start_date: "2023-12-01",
    end_date: "2024-05-01",
    location: "Surat, India",
    description:
      "Unpaid research internship focused on NLP-based depression detection from social media data.",
    achievements: [
      "Built end-to-end NLP depression detection system analyzing 20,000+ social media posts with 88.10% accuracy using ensemble methods and advanced feature engineering.",
      "Published peer-reviewed research in ICICC 2024 (Springer LNNS); presented novel classification methodology at international conference.",
    ],
    tech_stack: [
      "Python",
      "NLP",
      "Ensemble Methods",
      "Feature Engineering",
      "scikit-learn",
    ],
    case_study: EXPERIENCE_CASE_STUDY_BY_COMPANY["P P Savani University"],
    display_order: 4,
  },
]

const education = [
  {
    institution: "P P Savani University",
    degree: "Bachelor of Information Technology",
    start_date: "2021-08-01",
    end_date: "2025-05-01",
    description:
      "CGPA: 8.5/10 · Gold Medallist. Author of 3 peer-reviewed AI/ML research papers, including ICICC 2024 (Springer LNNS) on large-scale social media depression detection using NLP and ML.",
    achievements: [
      "Gold Medallist",
      "ICICC 2024 publication (Springer LNNS)",
      "3 peer-reviewed AI/ML research papers",
    ],
  },
]

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

const projects = [
  {
    slug: "bohrai-research-platform",
    title: "BohrAI — AI Research Automation Platform",
    summary:
      "Multi-agent research system automating literature discovery, evidence validation, and structured report generation with CLI + API and SSE streaming.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Built an AI-powered research system that automates end-to-end workflows including literature discovery, evidence validation, and structured report generation using multi-agent pipelines.",
        },
        {
          type: "bullet_list",
          items: [
            "Designed modular architecture combining CLI tool and lightweight API with real-time progress streaming (SSE).",
            "Implemented multi-agent orchestration with specialized sub-agents for literature retrieval, reasoning validation, and citation integrity.",
            "Developed hybrid retrieval pipeline integrating ArXiv, Semantic Scholar, and PubMed with rule-based validation.",
            "Engineered scalable execution with parallel processing, disk-backed state management, and dynamic model routing across LLM providers.",
          ],
        },
      ],
    },
    tech_stack: [
      "Python",
      "FastAPI",
      "LangGraph",
      "LangChain",
      "SSE",
      "Multi-Agent Systems",
    ],
    challenge:
      "Research teams spend hours manually searching papers, validating evidence, and assembling structured reports.",
    solution:
      "Multi-agent pipeline with literature retrieval, reasoning validation, and citation checks — exposed via CLI and SSE-streaming API.",
    impact:
      "Automates end-to-end research workflows and delivers structured reports with real-time progress visibility.",
    github_url: null,
    live_url: null,
    featured: true,
    status: "published",
    published_at: daysAgo(14),
  },
  {
    slug: "enterprise-file-governance",
    title: "Enterprise File Governance & AI Assistant Platform",
    summary:
      "Enterprise platform for monitoring, controlling, and governing sensitive file operations with AI-powered operator assistant and policy-driven automation.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Built an enterprise platform for monitoring, controlling, and governing sensitive file operations across Windows endpoints, integrating real-time telemetry, quarantine workflows, and approval-based deletion systems.",
        },
        {
          type: "bullet_list",
          items: [
            "Distributed architecture: FastAPI backend, PostgreSQL, Redis rate limiting, Windows agent with local buffering.",
            "AI-powered operator assistant using LLM tool-calling with structured workflows and human-in-the-loop approval.",
            "Streaming APIs (SSE) for real-time chat, event tracking, and long-running operations.",
            "Policy-driven automation with auto-delete scheduler and auditability.",
          ],
        },
      ],
    },
    tech_stack: [
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "LLM Tool-Calling",
      "SSE",
      "RBAC",
    ],
    challenge:
      "Sensitive file operations across Windows endpoints lacked centralized monitoring, policy enforcement, and operator tooling.",
    solution:
      "Distributed platform with endpoint agents, policy-driven quarantine workflows, and an LLM operator assistant with human-in-the-loop approvals.",
    impact:
      "Gives security teams real-time visibility, auditable governance, and faster incident response across the fleet.",
    github_url: null,
    live_url: null,
    featured: true,
    status: "published",
    published_at: daysAgo(30),
  },
  {
    slug: "nl-to-sql-platform",
    title: "NL-to-SQL Enterprise Reporting Platform",
    summary:
      "Schema-aware natural language interface enabling non-technical teams to query PostgreSQL, MySQL, and MSSQL databases without analyst dependency.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Built at 1POINT1 — an NL→SQL platform with schema-aware guardrails enabling non-technical sales and ops teams to query enterprise databases via natural language, eliminating analyst dependency for reporting and accelerating forecasting workflows.",
        },
        {
          type: "callout",
          variant: "info",
          content:
            "Supports PostgreSQL, MySQL, and MSSQL with validation layers to reduce hallucinations in generated queries.",
        },
      ],
    },
    tech_stack: [
      "Python",
      "LLM",
      "PostgreSQL",
      "MySQL",
      "MSSQL",
      "Azure OpenAI",
    ],
    challenge:
      "Sales and ops teams depended on analysts for every database report, slowing forecasting and decision-making.",
    solution:
      "Schema-aware NL-to-SQL interface with validation guardrails across PostgreSQL, MySQL, and MSSQL.",
    impact:
      "Non-technical teams query enterprise data directly, eliminating analyst bottlenecks for routine reporting.",
    github_url: null,
    live_url: null,
    featured: true,
    status: "published",
    published_at: daysAgo(45),
  },
  {
    slug: "notion-style-portfolio",
    title: "Notion-Style Portfolio CMS",
    summary:
      "Production-grade portfolio and knowledge base platform with integrated CMS, rich content blocks, and Supabase backend — this site.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "A Notion-inspired portfolio and content management system designed for AI engineers, featuring rich content blocks, Tiptap editor, and a public knowledge-base frontend.",
        },
      ],
    },
    tech_stack: ["Next.js", "Supabase", "TypeScript", "Tailwind CSS", "Tiptap"],
    challenge:
      "Engineering portfolios often require code deploys for every content change, with no structured CMS for case studies.",
    solution:
      "Notion-inspired CMS with rich content blocks, Tiptap editor, and Supabase-backed publishing workflow.",
    impact:
      "Content updates ship instantly without redeploys — this site runs on it.",
    github_url: "https://github.com/Dhruvil7694/notion_style_portfolio",
    title: "GenAI Cybersecurity Assistant",
    summary:
      "Real-time GenAI assistant handling 82,000+ cybersecurity scenarios with RAG and LangChain for faster incident triage.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Deployed at Cyber Security Umbrella — a GenAI real-time assistant handling 82,000+ cybersecurity scenarios using RAG + LangChain + Gemini API, achieving 40% faster incident triage on lightweight infrastructure.",
        },
      ],
    },
    tech_stack: ["Python", "LangChain", "RAG", "Gemini API", "FastAPI"],
    challenge:
      "Security analysts faced 82,000+ scenario types with slow manual triage on lightweight infrastructure.",
    solution:
      "RAG-powered GenAI assistant using LangChain and Gemini API for real-time scenario handling.",
    impact: "40% faster incident triage without scaling hardware.",
    github_url: null,
    live_url: null,
    featured: false,
    status: "published",
    published_at: daysAgo(90),
  },
]

const content = [
  {
    type: "research",
    slug: "production-rag-system-design",
    title: "Designing Production RAG Systems That Don't Hallucinate",
    excerpt:
      "Notes on validation layers, hybrid retrieval, and model routing for enterprise RAG pipelines.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Production RAG is not about embedding documents and calling an LLM. It is about building systems that handle failure cases, long-running processing, and real workflow constraints.",
        },
        {
          type: "heading",
          level: 2,
          content: "Hybrid retrieval beats pure vector search",
        },
        {
          type: "paragraph",
          content:
            "Combining rule-based parsing with selective RAG retrieval — as used in enterprise document intelligence — reduces hallucinations while maintaining coverage over structured fields.",
        },
        {
          type: "callout",
          variant: "info",
          content:
            "Model routing across providers based on cost, latency, and task complexity is as important as the retrieval pipeline itself.",
        },
      ],
    },
    tags: ["RAG", "LLM", "Production AI"],
    status: "published",
    published_at: daysAgo(20),
  },
  {
    type: "research",
    slug: "multi-agent-orchestration-patterns",
    title: "Multi-Agent Orchestration Patterns for Research Automation",
    excerpt:
      "Architecture notes from building BohrAI — central runtime, specialized sub-agents, and citation integrity validation.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Multi-agent systems work best when each agent has a narrow, verifiable responsibility. A central runtime coordinates literature retrieval, reasoning validation, and citation integrity as separate concerns.",
        },
        {
          type: "bullet_list",
          items: [
            "Literature retrieval agent: ArXiv, Semantic Scholar, PubMed integration.",
            "Reasoning validation agent: rule-based checks on evidence-backed outputs.",
            "Citation integrity agent: cross-reference validation before report generation.",
          ],
        },
      ],
    },
    tags: ["Multi-Agent", "LangGraph", "Research Automation"],
    status: "published",
    published_at: daysAgo(35),
  },
  {
    type: "blog",
    slug: "from-notebooks-to-production-ai",
    title: "From Notebooks to Production AI",
    excerpt:
      "What changes when you move from Jupyter experiments to systems that non-technical teams depend on daily.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "The gap between a working notebook and a production AI system is larger than most teams expect. It is not just about deployment — it is about guardrails, validation, concurrent processing, and designing for failure.",
        },
        {
          type: "paragraph",
          content:
            "At 1POINT1, building an NL-to-SQL platform taught me that schema-aware guardrails matter more than model selection. Non-technical users do not need the smartest model — they need a system that never returns a query that corrupts data.",
        },
      ],
    },
    tags: ["Production AI", "Engineering"],
    status: "published",
    published_at: daysAgo(10),
  },
  {
    type: "blog",
    slug: "llm-cost-optimization-strategies",
    title: "LLM Cost Optimization Without Sacrificing Quality",
    excerpt:
      "Dynamic model routing, token budgeting, and task-specific provider selection in multi-model systems.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Running multiple LLM providers in production — OpenAI, Anthropic, Ollama, vLLM — requires a routing layer that considers cost, latency, and task complexity for each request.",
        },
      ],
    },
    tags: ["LLM", "Cost Optimization", "MLOps"],
    status: "published",
    published_at: daysAgo(25),
  },
  {
    type: "automation",
    slug: "document-pipeline-automation",
    title: "Large-Scale Document Pipeline Automation",
    excerpt:
      "Parallel PDF splitting and Google Drive integration processing 1,000+ page files in under 2 minutes.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Enterprise bidding documents often exceed 1,000 pages. Manual review cycles take 1–2 hours per file. A parallel PDF splitting pipeline with Google Drive integration reduced this to under 2 minutes.",
        },
        {
          type: "bullet_list",
          items: [
            "Parallel PDF splitting with concurrent processing pipelines.",
            "Google Drive integration for automated ingestion and routing.",
            "Hybrid AI extraction: rule-based parsing + selective RAG for 80+ structured fields.",
          ],
        },
      ],
    },
    tags: ["Automation", "Document Intelligence", "PDF"],
    status: "published",
    published_at: daysAgo(15),
  },
  {
    type: "automation",
    slug: "soc-analytics-ingestion",
    title: "SOC Analytics Ingestion Pipeline",
    excerpt:
      "Real-time data aggregation from 6+ security tools with anomaly detection and automated threat monitoring.",
    content: {
      version: 1,
      blocks: [
        {
          type: "paragraph",
          content:
            "Built at Cyber Security Umbrella — a SOC analytics pipeline aggregating data from 6+ security tools with real-time ingestion, anomaly detection, and automated threat monitoring.",
        },
      ],
    },
    tags: ["SOC", "Automation", "Security"],
    status: "published",
    published_at: daysAgo(40),
  },
]

async function seed() {
  console.log("Clearing existing sample data…")
  for (const table of [
    "content",
    "experience",
    "education",
    "projects",
    "resumes",
  ]) {
    await clearTable(table)
  }

  console.log("Upserting settings…")
  const { error: settingsError } = await supabase
    .from("settings")
    .upsert(settings, { onConflict: "key" })
  if (settingsError) throw new Error(settingsError.message)

  console.log("Upserting skills…")
  const { error: skillsError } = await supabase
    .from("skills")
    .upsert(skills, { onConflict: "name" })
  if (skillsError) throw new Error(skillsError.message)

  console.log("Inserting experience…")
  const { error: experienceError } = await supabase
    .from("experience")
    .insert(experience)
  if (experienceError) throw new Error(experienceError.message)

  console.log("Inserting education…")
  const { error: educationError } = await supabase
    .from("education")
    .insert(education)
  if (educationError) throw new Error(educationError.message)

  console.log("Inserting projects…")
  const { error: projectsError } = await supabase
    .from("projects")
    .insert(projects)
  if (projectsError) throw new Error(projectsError.message)

  console.log("Inserting content…")
  const { error: contentError } = await supabase.from("content").insert(content)
  if (contentError) throw new Error(contentError.message)

  console.log("Inserting resume…")
  await supabase
    .from("resumes")
    .update({ is_active: false })
    .eq("is_active", true)
  const { error: resumeError } = await supabase.from("resumes").insert({
    file_path: "/resume/dhruvil-patel.pdf",
    version: 1,
    is_active: true,
  })
  if (resumeError) throw new Error(resumeError.message)

  console.log("Done. Resume sample data seeded successfully.")
}

seed().catch((error) => {
  console.error("Seed failed:", error.message)
  process.exit(1)
})
