#!/usr/bin/env node
/**
 * Backfill challenge / solution / impact on existing projects (no re-seed).
 * Usage: node scripts/backfill-project-preview-fields.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

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

const PREVIEW_FIELDS_BY_SLUG = {
  "bohrai-research-platform": {
    challenge:
      "Research teams spend hours manually searching papers, validating evidence, and assembling structured reports.",
    solution:
      "Multi-agent pipeline with literature retrieval, reasoning validation, and citation checks — exposed via CLI and SSE-streaming API.",
    impact:
      "Automates end-to-end research workflows and delivers structured reports with real-time progress visibility.",
  },
  "enterprise-file-governance": {
    challenge:
      "Sensitive file operations across Windows endpoints lacked centralized monitoring, policy enforcement, and operator tooling.",
    solution:
      "Distributed platform with endpoint agents, policy-driven quarantine workflows, and an LLM operator assistant with human-in-the-loop approvals.",
    impact:
      "Gives security teams real-time visibility, auditable governance, and faster incident response across the fleet.",
  },
  "nl-to-sql-platform": {
    challenge:
      "Sales and ops teams depended on analysts for every database report, slowing forecasting and decision-making.",
    solution:
      "Schema-aware NL-to-SQL interface with validation guardrails across PostgreSQL, MySQL, and MSSQL.",
    impact:
      "Non-technical teams query enterprise data directly, eliminating analyst bottlenecks for routine reporting.",
  },
  "notion-style-portfolio": {
    challenge:
      "Engineering portfolios often require code deploys for every content change, with no structured CMS for case studies.",
    solution:
      "Notion-inspired CMS with rich content blocks, Tiptap editor, and Supabase-backed publishing workflow.",
    impact: "Content updates ship instantly without redeploys — this site runs on it.",
  },
  "genai-cybersecurity-assistant": {
    challenge:
      "Security analysts faced 82,000+ scenario types with slow manual triage on lightweight infrastructure.",
    solution:
      "RAG-powered GenAI assistant using LangChain and Gemini API for real-time scenario handling.",
    impact: "40% faster incident triage without scaling hardware.",
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

for (const [slug, fields] of Object.entries(PREVIEW_FIELDS_BY_SLUG)) {
  const { error } = await supabase.from("projects").update(fields).eq("slug", slug)

  if (error) {
    console.error(`Failed to update ${slug}:`, error.message)
    process.exit(1)
  }

  console.log(`Updated ${slug}`)
}

console.log("Done. Project hover preview fields backfilled.")
