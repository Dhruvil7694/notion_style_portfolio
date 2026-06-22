#!/usr/bin/env node
/**
 * Backfill case study fields on existing projects (no re-seed).
 * Usage: node scripts/seed-project-case-study-fields.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

import { ARCHITECTURE_GRAPHS_BY_SLUG } from "./project-architecture-graphs.mjs"

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

const EMPTY_CONTENT = { version: 1, blocks: [] }

function toNodes(labels) {
  return labels.map((label) => ({ label }))
}

function toLines(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean)
}

const DIAGRAMS = {
  "bohrai-research-platform": {
    ai_design: toNodes([
      "Research Agent",
      "Validation Agent",
      "Citation Agent",
      "Writer Agent",
      "Final Report",
    ]),
    architecture: toNodes([
      "User",
      "FastAPI",
      "Orchestrator",
      "LangGraph",
      "Agent Network",
      "Storage Layer",
      "Response",
    ]),
  },
  "enterprise-file-governance": {
    ai_design: toNodes([
      "Operator Query",
      "Intent Router",
      "Tool-Calling Agent",
      "Policy Engine",
      "Action Executor",
      "Audit Log",
    ]),
    architecture: toNodes([
      "Windows Agent",
      "FastAPI Backend",
      "PostgreSQL",
      "Redis Rate Limiter",
      "SSE Stream",
      "LLM Operator Assistant",
      "Admin Console",
    ]),
  },
  "nl-to-sql-platform": {
    ai_design: toNodes([
      "Query Parser",
      "Schema Context Builder",
      "SQL Generator",
      "Validation Layer",
      "Result Explainer",
    ]),
    architecture: toNodes([
      "User",
      "FastAPI",
      "Schema Registry",
      "Azure OpenAI",
      "SQL Validator",
      "Database Connectors",
      "Formatted Response",
    ]),
  },
  "notion-style-portfolio": {
    ai_design: toNodes([
      "Content Editor",
      "Block Serializer",
      "ContentDocument Store",
      "Public Renderer",
      "Case Study Layout",
    ]),
    architecture: toNodes([
      "Admin Panel",
      "Next.js App Router",
      "Supabase PostgreSQL",
      "Storage Bucket",
      "Public Site",
      "RichContentRenderer",
    ]),
  },
  "genai-cybersecurity-assistant": {
    ai_design: toNodes([
      "Analyst Query",
      "Retrieval Pipeline",
      "Context Assembler",
      "Gemini Generator",
      "Response Validator",
      "Triage Recommendation",
    ]),
    architecture: toNodes([
      "Analyst",
      "FastAPI on SageMaker",
      "LangChain",
      "Vector Store",
      "Scenario Corpus",
      "Gemini API",
      "Audit Logger",
    ]),
  },
}

const CASE_STUDY_BY_SLUG = {
  "bohrai-research-platform": {
    tagline: "Multi-agent research automation platform",
    year: "2026",
    category: "AI Research",
    role: "Lead Engineer",
    overview:
      "BohrAI is a multi-agent research system that automates literature discovery, evidence validation, citation verification, and structured report generation.\n\nIt exposes both a CLI for local workflows and a lightweight FastAPI service with SSE streaming for real-time progress visibility.",
    problem:
      "Researchers spend hours manually finding papers, validating sources, checking references, and assembling reports. The process is repetitive, difficult to scale, and error-prone when citations are not verified against retrieved sources.\n\nTeams lose momentum waiting on manual literature reviews before they can synthesize findings or ship internal research memos.",
    why_built:
      "I built BohrAI after repeatedly hitting the same wall: research workflows that looked automated in demos but broke down when citations were wrong, sources were stale, or jobs ran longer than a single HTTP request could tolerate.\n\nI wanted a system I could trust for my own research — one that separated retrieval, validation, and writing into verifiable stages instead of one opaque LLM call.",
    approach: toLines(
      "Query Understanding\nResearch Planning\nSource Discovery\nEvidence Validation\nReport Generation"
    ),
    challenges: [
      {
        challenge: "Citation hallucinations in generated reports",
        solution:
          "Built a validation layer that cross-checks every citation against retrieved source metadata before the writer agent assembles the final report.",
      },
      {
        challenge: "Long-running research jobs blocking HTTP requests",
        solution:
          "Implemented SSE streaming with checkpoint persistence so jobs survive restarts and clients receive incremental progress updates.",
      },
      {
        challenge: "Inconsistent quality across LLM providers",
        solution:
          "Added dynamic model routing based on task type — cheaper models for planning, stronger models for synthesis and validation.",
      },
    ],
    results: toLines(
      "Reduced manual research effort for literature reviews\nAutomated evidence validation against retrieved sources\nParallelized multi-source discovery across ArXiv, Semantic Scholar, and PubMed\nProduction-ready CLI + API with real-time progress streaming"
    ),
    learnings: toLines(
      "Retrieval quality matters more than model quality for research automation.\nValidation layers are mandatory — never trust raw LLM citations.\nMulti-agent systems introduce coordination complexity that must be designed upfront.\nDisk-backed checkpointing is essential for jobs that exceed single-request timeouts."
    ),
  },
  "enterprise-file-governance": {
    tagline: "Endpoint file governance with AI operator assistant",
    year: "2025",
    category: "Enterprise Security",
    role: "Lead Engineer",
    overview:
      "An enterprise platform for monitoring, controlling, and governing sensitive file operations across Windows endpoints. It combines real-time telemetry, policy-driven quarantine workflows, and an AI-powered operator assistant with human-in-the-loop approvals.\n\nDesigned for security teams that need visibility and control without blocking legitimate operator workflows.",
    problem:
      "Sensitive file operations across Windows endpoints lacked centralized monitoring, policy enforcement, and operator tooling. Security teams had no unified view of delete, move, or exfiltration events across the fleet.\n\nManual incident response was slow because operators lacked context and had no structured approval path for risky actions.",
    why_built:
      "Enterprise security tooling often monitors network traffic but ignores the file layer where data actually leaves. I built this after seeing teams react to file incidents with spreadsheets and email chains instead of auditable workflows.\n\nThe goal was operator-grade tooling: fast enough for daily use, strict enough for compliance.",
    approach: toLines(
      "Endpoint telemetry collection\nCentral event ingestion\nPolicy evaluation engine\nQuarantine and approval workflows\nAI operator assistant with tool-calling"
    ),
    challenges: [
      {
        challenge: "High-volume file events overwhelming the backend",
        solution:
          "Added local buffering on endpoint agents with batch upload and Redis-backed rate limiting on the API layer.",
      },
      {
        challenge: "Risky automated actions without human oversight",
        solution:
          "Implemented human-in-the-loop approval queues for destructive operations with full audit trails.",
      },
      {
        challenge: "Operators needed natural language access to complex policies",
        solution:
          "Built an LLM assistant with structured tool-calling against policy and event APIs, streaming responses via SSE.",
      },
    ],
    results: toLines(
      "Real-time visibility into file operations across Windows endpoints\nPolicy-driven quarantine and approval workflows\nAuditable governance for destructive file actions\nAI operator assistant reducing mean time to investigate"
    ),
    learnings: toLines(
      "Human-in-the-loop is non-negotiable for destructive automation.\nSSE streaming keeps operators engaged during long-running investigations.\nEndpoint agents must buffer locally — the network will fail.\nTool-calling works best when each tool maps to one auditable backend action."
    ),
  },
  "nl-to-sql-platform": {
    tagline: "Schema-aware natural language database interface",
    year: "2025",
    category: "Enterprise AI",
    role: "AI Engineer",
    overview:
      "An NL-to-SQL platform with schema-aware guardrails that enables non-technical sales and ops teams to query PostgreSQL, MySQL, and MSSQL databases via natural language.\n\nBuilt at 1POINT1 to eliminate analyst dependency for routine reporting and accelerate forecasting workflows.",
    problem:
      "Sales and ops teams depended on analysts for every database report, slowing forecasting and decision-making. Simple questions like weekly pipeline totals required ticket queues and multi-day turnaround.\n\nAnalyst time was spent on repetitive queries instead of higher-value analysis.",
    why_built:
      "I saw the same pattern repeatedly: business teams knew what question they wanted answered but not how to write SQL safely. Existing BI tools required training; raw LLM-to-SQL demos were dangerous without guardrails.\n\nI wanted a system where non-technical users could self-serve without risking data corruption.",
    approach: toLines(
      "Schema ingestion and indexing\nNatural language intent parsing\nSQL generation with dialect awareness\nValidation and guardrail checks\nResult formatting and explanation"
    ),
    challenges: [
      {
        challenge: "LLM-generated SQL causing destructive queries",
        solution:
          "Added schema-aware guardrails that block DDL, limit row counts, and require read-only connection roles for generated queries.",
      },
      {
        challenge: "Dialect differences across PostgreSQL, MySQL, and MSSQL",
        solution:
          "Built dialect-specific prompt context and post-generation syntax validation per database engine.",
      },
      {
        challenge: "Users not trusting black-box query results",
        solution:
          "Returned the generated SQL alongside natural language explanations so users could verify before re-running.",
      },
    ],
    results: toLines(
      "Non-technical teams query enterprise data directly\nEliminated analyst bottlenecks for routine reporting\nSchema-aware guardrails preventing destructive SQL\nSupport for PostgreSQL, MySQL, and MSSQL from one interface"
    ),
    learnings: toLines(
      "Schema-aware guardrails matter more than model selection for NL-to-SQL.\nUsers need to see the generated SQL — transparency builds trust.\nRead-only database roles are a hard requirement, not an optimization.\nDialect-specific validation catches more errors than prompt engineering alone."
    ),
  },
  "notion-style-portfolio": {
    tagline: "CMS-driven portfolio and knowledge base",
    year: "2026",
    category: "Full-Stack",
    role: "Solo Builder",
    overview:
      "A Notion-inspired portfolio and content management system designed for AI engineers. It features rich content blocks, a Tiptap editor, structured case study fields, and a Supabase-backed publishing workflow.\n\nThis site runs on it — content updates ship without redeploys.",
    problem:
      "Engineering portfolios often require code deploys for every content change. Most CMS options are either too marketing-focused or too rigid for technical case studies with architecture diagrams, code blocks, and structured project metadata.\n\nI needed a system that treated project pages like engineering documentation, not blog posts.",
    why_built:
      "Every portfolio I evaluated forced a tradeoff: beautiful design with no CMS, or a CMS that produced generic blog layouts. As an AI engineer, I wanted to publish case studies with the same structure I use in internal design docs.\n\nBuilding my own CMS let me control the content model, rendering pipeline, and admin workflow end to end.",
    approach: toLines(
      "ContentDocument schema design\nTiptap editor with custom block nodes\nSupabase-backed CMS with RLS\nPublic rendering pipeline\nStructured case study fields for project pages"
    ),
    challenges: [
      {
        challenge: "Rich content that survives edit-save-reload cycles",
        solution:
          "Designed a serializable ContentDocument schema with explicit block types instead of storing raw HTML from the editor.",
      },
      {
        challenge: "Project pages mixing structured and freeform content",
        solution:
          "Split case study fields (problem, approach, architecture) from Tiptap body content, rendering structured sections first.",
      },
      {
        challenge: "Admin mutations bypassing RLS policies",
        solution:
          "Used service-role client only in server actions with explicit auth checks, keeping public reads on RLS-protected published content.",
      },
    ],
    results: toLines(
      "Content updates ship instantly without redeploys\nStructured case study pages for engineering projects\nRich content blocks including architecture diagrams and code\nFull admin CMS with autosave and publishing workflow"
    ),
    learnings: toLines(
      "A serializable content schema pays off the first time you need to migrate block types.\nStructured CMS fields and freeform rich content coexist best when fields have clear ownership.\nDocumentation-first UI beats marketing-first UI for engineering portfolios.\nSupabase RLS + server actions is a clean split for CMS auth patterns."
    ),
  },
  "genai-cybersecurity-assistant": {
    tagline: "RAG-powered incident triage assistant",
    year: "2024",
    category: "Cybersecurity AI",
    role: "AI/ML Engineer",
    overview:
      "A GenAI real-time assistant deployed at Cyber Security Umbrella, handling 82,000+ cybersecurity scenarios using RAG, LangChain, and the Gemini API.\n\nBuilt for security analysts who needed faster triage on lightweight infrastructure without scaling hardware.",
    problem:
      "Security analysts faced 82,000+ scenario types with slow manual triage. Lookup tables and runbooks were fragmented across tools, and new analysts had long ramp-up times.\n\nIncident response speed was bottlenecked by knowledge retrieval, not analysis capability.",
    why_built:
      "Cybersecurity knowledge does not fit in a single prompt. I built this after watching analysts context-switch between six tools to answer one triage question.\n\nThe goal was a single conversational interface grounded in verified scenario data — fast enough for real-time SOC workflows.",
    approach: toLines(
      "Scenario corpus ingestion and chunking\nHybrid retrieval with metadata filtering\nLangChain orchestration pipeline\nGemini API for response generation\nFastAPI deployment on SageMaker"
    ),
    challenges: [
      {
        challenge: "82,000+ scenarios causing retrieval noise",
        solution:
          "Added metadata filtering by scenario category and severity before vector search to narrow the candidate set.",
      },
      {
        challenge: "Lightweight infrastructure limiting concurrent requests",
        solution:
          "Optimized chunk sizes and caching for frequent queries, achieving 40% faster triage without hardware scaling.",
      },
      {
        challenge: "Hallucinated remediation steps in security context",
        solution:
          "Constrained generation to retrieved scenario text with citation requirements and confidence scoring.",
      },
    ],
    results: toLines(
      "40% faster incident triage on existing infrastructure\n82,000+ cybersecurity scenarios accessible via conversational interface\nDeployed on AWS SageMaker with auto-scaling FastAPI endpoints\nReduced analyst ramp-up time for scenario lookup"
    ),
    learnings: toLines(
      "Metadata filtering beats larger embedding models for large structured corpora.\nSecurity AI requires citation grounding — generic RAG is not enough.\nCaching frequent queries delivers more latency wins than model upgrades.\nLightweight infrastructure constraints force better retrieval design."
    ),
  },
}

const V2_FIELDS_BY_SLUG = {
  "bohrai-research-platform": {
    metrics: [
      { value: "5 stages", label: "Verified research pipeline" },
      { value: "3 sources", label: "Parallel literature discovery" },
      { value: "SSE", label: "Real-time job progress" },
    ],
    my_contribution: toLines(
      "Designed the multi-agent orchestration and validation pipeline\nBuilt SSE streaming with checkpoint persistence\nImplemented citation cross-checking against retrieved metadata"
    ),
    tech_stack_groups: [
      { category: "AI / Agents", items: ["LangGraph", "LangChain", "Multi-agent orchestration"] },
      { category: "Backend", items: ["FastAPI", "Python", "SSE"] },
      { category: "Research APIs", items: ["ArXiv", "Semantic Scholar", "PubMed"] },
    ],
    tradeoffs: [
      {
        decision: "Chose SSE streaming over synchronous HTTP",
        tradeoff:
          "Added client complexity and reconnect handling, but jobs survive restarts and analysts see incremental progress instead of blocking on long runs.",
      },
      {
        decision: "Separated validation from generation agents",
        tradeoff:
          "Higher coordination overhead and latency between stages, but citation accuracy became auditable instead of buried in one opaque LLM call.",
      },
    ],
    timeline: [
      {
        period: "Phase 1",
        title: "CLI prototype with retrieval + validation",
        description: "Validated that citation checking against source metadata eliminated the worst hallucinations.",
      },
      {
        period: "Phase 2",
        title: "FastAPI service with SSE and checkpoints",
        description: "Productionized long-running jobs without losing progress on restarts.",
      },
    ],
  },
  "genai-cybersecurity-assistant": {
    metrics: [
      { value: "40%", label: "Faster incident triage" },
      { value: "82K+", label: "Scenario corpus coverage" },
    ],
    my_contribution: toLines(
      "Built metadata-filtered retrieval over the scenario corpus\nDeployed FastAPI on SageMaker with caching for frequent queries\nConstrained generation to retrieved scenario text with citations"
    ),
    tech_stack_groups: [
      { category: "AI", items: ["LangChain", "RAG", "Gemini API"] },
      { category: "Infrastructure", items: ["AWS SageMaker", "FastAPI", "Vector Store"] },
    ],
    tradeoffs: [
      {
        decision: "Metadata filtering before vector search",
        tradeoff:
          "Required upfront corpus structuring, but dramatically reduced retrieval noise across 82K+ scenarios compared to pure embedding search.",
      },
    ],
  },
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedCaseStudyFields() {
  const { data: projects, error: fetchError } = await supabase
    .from("projects")
    .select("slug, title")

  if (fetchError) {
    throw new Error(`Failed to fetch projects: ${fetchError.message}`)
  }

  if (!projects?.length) {
    console.log("No projects found in database.")
    return
  }

  let updated = 0
  let skipped = 0

  for (const project of projects) {
    const fields = {
      ...CASE_STUDY_BY_SLUG[project.slug],
      ...DIAGRAMS[project.slug],
      ...ARCHITECTURE_GRAPHS_BY_SLUG[project.slug],
      ...V2_FIELDS_BY_SLUG[project.slug],
      content: EMPTY_CONTENT,
    }

    if (!fields) {
      console.warn(`No case study data for slug: ${project.slug} (${project.title})`)
      skipped += 1
      continue
    }

    const { error } = await supabase.from("projects").update(fields).eq("slug", project.slug)

    if (error) {
      throw new Error(`Failed to update ${project.slug}: ${error.message}`)
    }

    console.log(`Updated ${project.slug}`)
    updated += 1
  }

  console.log(`Done. ${updated} project(s) seeded, ${skipped} skipped.`)
}

seedCaseStudyFields().catch((error) => {
  console.error("Seed failed:", error.message)
  process.exit(1)
})
