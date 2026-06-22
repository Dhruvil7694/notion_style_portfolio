import type { Experience } from "@/types/database.helpers"

export const EXPERIENCE_STACK_ORDER = [
  "AI",
  "Backend",
  "Database",
  "Cloud",
  "Infrastructure",
  "Frontend",
  "Tools",
] as const

export type ExperienceStackCategory = (typeof EXPERIENCE_STACK_ORDER)[number]
export type ExperienceStackGroups = Record<ExperienceStackCategory, string[]>

const STACK_CATEGORIES: Array<{
  label: ExperienceStackCategory
  matcher: (item: string) => boolean
}> = [
  {
    label: "AI",
    matcher: (item) =>
      /(^|\b)(ai|ml|llm|langchain|rag|tensor|opencv|nlp|lora|qlora|gemini|openai|ensemble|feature engineering|cnn|lstm|computer vision|deep learning|genai|prompt|embedding|vector|ocr|hybrid extraction)(\b|$)/.test(
        item
      ),
  },
  {
    label: "Backend",
    matcher: (item) =>
      /(^|\b)(fastapi|flask|django|node|express|api|python|java|golang|rest|sse|async|celery|uvicorn)(\b|$)/.test(
        item
      ),
  },
  {
    label: "Database",
    matcher: (item) =>
      /(^|\b)(postgres|mysql|mssql|sql server|redis|mongo|database|sqlite|supabase)(\b|$)/.test(
        item
      ),
  },
  {
    label: "Cloud",
    matcher: (item) =>
      /(^|\b)(aws|azure|gcp|sagemaker|ec2|cloud|google drive|drive api)(\b|$)/.test(item),
  },
  {
    label: "Infrastructure",
    matcher: (item) =>
      /(^|\b)(docker|kubernetes|ci|cd|infra|terraform|queue|concurrent|nginx|linux|git|github|gitlab|monitoring|logging)(\b|$)/.test(
        item
      ),
  },
  {
    label: "Frontend",
    matcher: (item) =>
      /(^|\b)(react|next|typescript|javascript|frontend|ui|tailwind|html|css)(\b|$)/.test(item),
  },
  {
    label: "Tools",
    matcher: (item) =>
      /(^|\b)(pdf|jupyter|pandas|numpy|postman|figma|notion|vscode|pytorch|scikit|opencv|drive|automation|workflow|integration|document|parsing)(\b|$)/.test(
        item
      ),
  },
]

const TECH_ICON_MAP: Record<string, string> = {
  python: "logos:python",
  fastapi: "simple-icons:fastapi",
  flask: "simple-icons:flask",
  django: "logos:django-icon",
  postgresql: "logos:postgresql",
  postgres: "logos:postgresql",
  mysql: "logos:mysql-icon",
  "microsoft sql server": "simple-icons:microsoftsqlserver",
  mssql: "simple-icons:microsoftsqlserver",
  redis: "logos:redis",
  mongodb: "logos:mongodb-icon",
  mongo: "logos:mongodb-icon",
  sqlite: "logos:sqlite",
  supabase: "logos:supabase-icon",
  "azure openai": "logos:microsoft-azure",
  azure: "logos:microsoft-azure",
  openai: "logos:openai-icon",
  langchain: "simple-icons:langchain",
  rag: "lucide:brain-circuit",
  "vector store": "lucide:layers",
  sagemaker: "logos:aws",
  tensorflow: "logos:tensorflow",
  pytorch: "logos:pytorch-icon",
  "aws sagemaker": "logos:aws",
  "aws ec2": "logos:aws-ec2",
  aws: "logos:aws",
  docker: "logos:docker-icon",
  kubernetes: "logos:kubernetes",
  react: "logos:react",
  "next.js": "logos:nextjs-icon",
  nextjs: "logos:nextjs-icon",
  typescript: "logos:typescript-icon",
  javascript: "logos:javascript",
  node: "logos:nodejs-icon",
  nodejs: "logos:nodejs-icon",
  git: "logos:git-icon",
  github: "logos:github-icon",
  gitlab: "logos:gitlab",
  "google drive": "logos:google-drive",
  "google drive api": "logos:google-drive",
  gemini: "logos:google-gemini",
  "gemini api": "logos:google-gemini",
  nlp: "lucide:languages",
  opencv: "simple-icons:opencv",
  pandas: "logos:pandas-icon",
  numpy: "logos:numpy",
  jupyter: "logos:jupyter",
  "lora/qlora": "lucide:sliders-horizontal",
  lora: "lucide:sliders-horizontal",
  qlora: "lucide:sliders-horizontal",
  "ensemble methods": "lucide:layers",
  "feature engineering": "lucide:filter",
  "cnn-lstm": "lucide:network",
  "computer vision": "lucide:scan-eye",
  pdf: "lucide:file-text",
  "pdf processing": "lucide:file-text",
  sse: "lucide:radio",
  rest: "lucide:plug",
  "rest api": "lucide:plug",
  linux: "logos:linux-tux",
  nginx: "logos:nginx",
  postman: "logos:postman-icon",
  tailwind: "logos:tailwindcss-icon",
  "hybrid extraction": "lucide:combine",
  automation: "lucide:workflow",
  workflow: "lucide:workflow",
  integration: "lucide:link-2",
  concurrent: "lucide:git-branch",
  "concurrent processing": "lucide:git-branch",
  parsing: "lucide:file-search",
  "document intelligence": "lucide:file-search",
  "rule-based parsing": "lucide:list-tree",
  monitoring: "lucide:activity",
  logging: "lucide:scroll-text",
}

const INFERRED_TECH: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bpostgresql\b/i, label: "PostgreSQL" },
  { pattern: /\bmysql\b/i, label: "MySQL" },
  { pattern: /\bmssql\b|\bsql server\b/i, label: "Microsoft SQL Server" },
  { pattern: /\bgoogle drive\b/i, label: "Google Drive API" },
  { pattern: /\bpdf\b/i, label: "PDF Processing" },
  { pattern: /\bgemini\b/i, label: "Gemini API" },
  { pattern: /\bopencv\b|\bcomputer vision\b/i, label: "Computer Vision" },
  { pattern: /\bsse\b|\bstreaming\b/i, label: "SSE" },
  { pattern: /\brest\b|\bapi endpoints?\b/i, label: "REST API" },
  { pattern: /\bconcurrent\b|\bparallel\b/i, label: "Concurrent Processing" },
  { pattern: /\brule-?based parsing\b/i, label: "Rule-based Parsing" },
  { pattern: /\bhybrid\b.*\brag\b|\brag\b.*\bhybrid\b/i, label: "Hybrid Extraction" },
  { pattern: /\banomaly detection\b/i, label: "Anomaly Detection" },
  { pattern: /\bagile\b/i, label: "Agile" },
  { pattern: /\bdocker\b/i, label: "Docker" },
  { pattern: /\bgit\b/i, label: "Git" },
  { pattern: /\bredis\b/i, label: "Redis" },
  { pattern: /\bnext\.?js\b/i, label: "Next.js" },
  { pattern: /\breact\b/i, label: "React" },
  { pattern: /\btypescript\b/i, label: "TypeScript" },
]

const ROLE_DEFAULTS: Record<string, string[]> = {
  "ai engineer": [
    "Python",
    "FastAPI",
    "REST API",
    "Git",
    "Docker",
    "PDF Processing",
    "Concurrent Processing",
  ],
  "ai/ml engineer": [
    "Python",
    "FastAPI",
    "REST API",
    "Git",
    "Docker",
    "Monitoring",
    "Logging",
  ],
  "ai/ml researcher": ["Python", "Jupyter", "Pandas", "NumPy", "Git"],
}

function normalizeTechKey(value: string): string {
  return value.trim().toLowerCase()
}

function canonicalizeTechLabel(value: string): string {
  const key = normalizeTechKey(value)
  const aliases: Record<string, string> = {
    postgres: "PostgreSQL",
    postgresql: "PostgreSQL",
    mssql: "Microsoft SQL Server",
    "sql server": "Microsoft SQL Server",
    "azure openai": "Azure OpenAI",
    "lora/qlora": "LoRA/QLoRA",
    lora: "LoRA",
    qlora: "QLoRA",
    "google drive api": "Google Drive API",
    "rest api": "REST API",
    nextjs: "Next.js",
    "next.js": "Next.js",
    genai: "GenAI",
    rag: "RAG",
    nlp: "NLP",
    api: "REST API",
    sse: "SSE",
    git: "Git",
    docker: "Docker",
    redis: "Redis",
    pdf: "PDF Processing",
    "pdf processing": "PDF Processing",
  }

  return aliases[key] ?? value.trim()
}

function dedupeTechLabels(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const label = canonicalizeTechLabel(item)
    const key = normalizeTechKey(label)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(label)
  }

  return result
}

function inferTechFromText(text: string): string[] {
  const inferred: string[] = []

  for (const entry of INFERRED_TECH) {
    if (entry.pattern.test(text)) {
      inferred.push(entry.label)
    }
  }

  return inferred
}

export function expandExperienceTechStack(experience: Experience): string[] {
  const corpus = [
    experience.description ?? "",
    ...experience.achievements,
    ...experience.tech_stack,
  ].join("\n")

  const roleKey = experience.role.trim().toLowerCase()
  const roleDefaults =
    Object.entries(ROLE_DEFAULTS).find(([key]) => roleKey.includes(key))?.[1] ?? []

  return dedupeTechLabels([
    ...experience.tech_stack,
    ...roleDefaults,
    ...inferTechFromText(corpus),
  ])
}

export function groupExperienceTechStack(stack: string[]): ExperienceStackGroups {
  const groups = Object.fromEntries(
    EXPERIENCE_STACK_ORDER.map((label) => [label, [] as string[]])
  ) as ExperienceStackGroups

  const uncategorized: string[] = []

  for (const raw of stack) {
    const item = normalizeTechKey(raw)
    const category = STACK_CATEGORIES.find((entry) => entry.matcher(item))
    if (category) {
      groups[category.label].push(canonicalizeTechLabel(raw))
    } else {
      uncategorized.push(canonicalizeTechLabel(raw))
    }
  }

  if (uncategorized.length > 0) {
    groups.Tools.push(...uncategorized)
  }

  for (const key of EXPERIENCE_STACK_ORDER) {
    groups[key] = dedupeTechLabels(groups[key])
  }

  return groups
}

export function resolveTechStackIcon(label: string): string {
  const key = normalizeTechKey(label)

  if (TECH_ICON_MAP[key]) {
    return TECH_ICON_MAP[key]
  }

  const partial = Object.entries(TECH_ICON_MAP).find(([name]) => key.includes(name))
  if (partial) {
    return partial[1]
  }

  if (/(ai|ml|llm|rag|nlp|model)/.test(key)) return "lucide:brain-circuit"
  if (/(api|backend|server)/.test(key)) return "lucide:server"
  if (/(database|sql)/.test(key)) return "lucide:database"
  if (/(cloud|aws|azure|gcp)/.test(key)) return "lucide:cloud"
  if (/(infra|docker|kubernetes|git)/.test(key)) return "lucide:boxes"
  if (/(frontend|react|ui)/.test(key)) return "lucide:layout-template"

  return "lucide:wrench"
}
