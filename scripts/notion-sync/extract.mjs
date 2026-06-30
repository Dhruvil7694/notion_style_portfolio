import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const SRC = path.join(ROOT, "src")
const API_DIR = path.join(SRC, "app", "api")
const FEATURES_DIR = path.join(SRC, "features")
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations")

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]

/** Maps API route prefixes to feature module names */
const API_FEATURE_MAP = {
  "/api/chat": "ai-assistant",
  "/api/chat/validate-jd": "job-fit",
  "/api/chat/validate-jd-feedback": "job-fit",
  "/api/discovery": "discovery",
  "/api/knowledge-graph": "knowledge-base",
  "/api/notify-employer": "job-fit",
  "/api/job-fit/export-pdf": "job-fit",
  "/api/job-fit/analytics/fit-complete": "job-fit",
  "/api/copilot/chat": "copilot",
  "/api/copilot/sessions": "copilot",
  "/api/copilot/tools": "copilot",
  "/api/admin/ai-settings/validate-key": "admin",
  "/api/admin/ai-usage/verify": "admin",
  "/api/admin/seo/save": "admin",
  "/api/admin/visibility/preview": "visibility",
  "/api/admin/visibility/apply": "visibility",
  "/api/admin/visibility/fix": "visibility",
  "/api/admin/insights/portfolio-analysis": "admin",
  "/api/debug/sentry-test": "admin",
}

const FEATURE_DESCRIPTIONS = {
  about: "About page content and embedded Snake mini-game.",
  admin: "Full CMS dashboard, forms, server actions, and audit panels.",
  aeo: "Answer Engine Optimization audit engine for AI-citation readiness.",
  ai: "Core AI infrastructure: providers, RAG, streaming, usage tracking.",
  "ai-assistant": "Public portfolio chat UI wired to /api/chat.",
  "ai-first": "Dedicated /ai-first landing page components.",
  automations: "Automation showcase pages for content type automation.",
  contact: "Contact form UI and server action submission.",
  content: "TipTap editor, block extensions, and public renderer.",
  copilot: "Admin LangGraph agent with propose/apply workflow.",
  deployment: "Launch readiness checks for env, DB, and settings.",
  diagrams: "Interactive architecture diagrams (React Flow / Joint.js).",
  discovery: "Site-wide search indexer and /explore integration.",
  experience: "Work history list and case-study accordion components.",
  geo: "Generative Engine Optimization audit engine.",
  home: "Homepage section composition and previews.",
  "job-fit": "JD validation, fit analysis, PDF export, employer notify.",
  "knowledge-base": "Knowledge graph builder and entity hub pages.",
  personalization: "Visitor interest signals via localStorage.",
  portfolio: "Shared public data layer, settings, and revalidation helpers.",
  projects: "Project listing, filters, and case study pages.",
  research: "Research article list and detail components.",
  resume: "Resume preview and download UI.",
  seo: "Metadata, JSON-LD, sitemap, robots, and SEO audit engine.",
  "site-shell": "Public layout chrome: header, footer, dock, theme.",
  visibility: "AI visibility fix agents for SEO/AEO/GEO.",
  writing: "Blog list components for content type blog.",
}

async function walkFiles(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      await walkFiles(fullPath, acc)
    } else {
      acc.push(fullPath)
    }
  }
  return acc
}

function routePathFromFile(filePath) {
  const relative = path.relative(API_DIR, filePath).replace(/\\/g, "/")
  if (!relative.endsWith("/route.ts")) return null
  const segments = relative.replace(/\/route\.ts$/, "").split("/")
  return `/api/${segments.join("/")}`
}

export async function extractApiRoutes() {
  const files = await walkFiles(API_DIR)
  const routes = []

  for (const file of files) {
    if (!file.endsWith("route.ts")) continue
    const routePath = routePathFromFile(file)
    if (!routePath) continue

    const source = await readFile(file, "utf8")
    const methods = HTTP_METHODS.filter((method) =>
      new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source)
    )

    if (methods.length > 0) {
      routes.push({ path: routePath, methods })
    }
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

export async function extractPackageJson() {
  const raw = await readFile(path.join(ROOT, "package.json"), "utf8")
  const pkg = JSON.parse(raw)
  return {
    name: pkg.name,
    version: pkg.version,
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
  }
}

async function countFeatureFiles(featureName) {
  const featureDir = path.join(FEATURES_DIR, featureName)
  const files = await walkFiles(featureDir)
  return files.filter((file) => /\.(ts|tsx|mjs|js)$/.test(file)).length
}

async function listFeatureSubdirs(featureName) {
  const featureDir = path.join(FEATURES_DIR, featureName)
  const entries = await readdir(featureDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

export async function extractFeatures(apiRoutes) {
  const entries = await readdir(FEATURES_DIR, { withFileTypes: true })
  const featureNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  const routesByFeature = new Map()
  for (const route of apiRoutes) {
    const feature = API_FEATURE_MAP[route.path]
    if (!feature) continue
    const list = routesByFeature.get(feature) ?? []
    list.push(`${route.methods.join(", ")} ${route.path}`)
    routesByFeature.set(feature, list)
  }

  const features = []
  for (const name of featureNames.sort()) {
    features.push({
      name,
      description: FEATURE_DESCRIPTIONS[name] ?? `Feature module: ${name}`,
      fileCount: await countFeatureFiles(name),
      subdirs: await listFeatureSubdirs(name),
      apiRoutes: routesByFeature.get(name) ?? [],
    })
  }

  return features
}

export async function extractDirectoryTree() {
  const lines = ["notion-style-portfolio/"]

  async function walk(dir, prefix = "", depth = 0) {
    if (depth > 4) return
    const entries = await readdir(dir, { withFileTypes: true })
    const filtered = entries
      .filter(
        (entry) => !["node_modules", ".next", ".git"].includes(entry.name)
      )
      .sort((a, b) => a.name.localeCompare(b.name))

    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i]
      const isLast = i === filtered.length - 1
      const branch = isLast ? "└── " : "├── "
      const childPrefix = isLast ? "    " : "│   "
      const relative = path
        .relative(ROOT, path.join(dir, entry.name))
        .replace(/\\/g, "/")
      lines.push(
        `${prefix}${branch}${entry.name}${entry.isDirectory() ? "/" : ""}`
      )

      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name), prefix + childPrefix, depth + 1)
      } else if (lines.length > 120) {
        return
      }
    }
  }

  await walk(ROOT)
  return lines.slice(0, 120).join("\n")
}

function parseColumnDef(line) {
  const trimmed = line.trim().replace(/,$/, "")
  if (
    !trimmed ||
    trimmed.startsWith("CONSTRAINT") ||
    trimmed.startsWith("PRIMARY KEY")
  ) {
    return null
  }

  const match = trimmed.match(/^"?(\w+)"?\s+([\w\[\]()]+)(.*)$/i)
  if (!match) return null

  const [, column, dataType, rest] = match
  const nullable = !/NOT NULL/i.test(rest)
  const defaultMatch = rest.match(/DEFAULT\s+([^,\s]+(?:\s*::[\w\[\]]+)?)/i)

  return {
    column: column.toLowerCase(),
    dataType: dataType.toLowerCase(),
    nullable,
    defaultValue: defaultMatch?.[1]?.replace(/::[\w\[\]]+$/, "") ?? "",
    constraints: rest.trim(),
  }
}

function parseCreateTable(sql, tableName, columns) {
  const regex = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${tableName}\\s*\\(([^;]+)\\)`,
    "is"
  )
  const match = sql.match(regex)
  if (!match) return

  const body = match[1]
  const lines = body.split("\n")
  for (const line of lines) {
    const parsed = parseColumnDef(line)
    if (parsed) {
      columns.push({
        table: tableName,
        ...parsed,
        description: "",
        relations: "",
      })
    }
  }
}

function parseAlterTable(sql, tableName, columns) {
  const regex = new RegExp(
    `ALTER\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${tableName}\\s+ADD\\s+COLUMN\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([\\s\\S]*?);`,
    "gi"
  )

  let match
  while ((match = regex.exec(sql)) !== null) {
    const chunk = match[1]
    const parts = chunk.split(",").map((part) => part.trim())
    for (const part of parts) {
      const parsed = parseColumnDef(part)
      if (parsed) {
        columns.push({
          table: tableName,
          ...parsed,
          description: "",
          relations: "",
        })
      }
    }
  }
}

export async function extractSchema() {
  const files = await readdir(MIGRATIONS_DIR)
  const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort()
  const columns = []
  const seen = new Set()

  for (const file of sqlFiles) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8")
    const tableMatches = [
      ...sql.matchAll(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi
      ),
    ]
    for (const tableMatch of tableMatches) {
      parseCreateTable(sql, tableMatch[1].toLowerCase(), columns)
    }

    const alterMatches = [
      ...sql.matchAll(
        /ALTER\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi
      ),
    ]
    for (const alterMatch of alterMatches) {
      parseAlterTable(sql, alterMatch[1].toLowerCase(), columns)
    }
  }

  const deduped = []
  for (const col of columns) {
    const key = `${col.table}.${col.column}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(col)
  }

  const enums = [
    {
      table: "enums",
      column: "content_status",
      dataType: "enum",
      nullable: false,
      defaultValue: "",
      constraints: "",
      description: "draft, published, archived",
      relations: "",
    },
    {
      table: "enums",
      column: "content_type",
      dataType: "enum",
      nullable: false,
      defaultValue: "",
      constraints: "",
      description: "blog, research, automation, publication, note",
      relations: "",
    },
    {
      table: "enums",
      column: "skill_category",
      dataType: "enum",
      nullable: false,
      defaultValue: "",
      constraints: "",
      description: "language, framework, tool, cloud, ai_ml, soft, other",
      relations: "",
    },
    {
      table: "enums",
      column: "skill_proficiency",
      dataType: "enum",
      nullable: false,
      defaultValue: "",
      constraints: "",
      description: "learning, proficient, expert",
      relations: "",
    },
  ]

  return [
    ...deduped.sort((a, b) =>
      `${a.table}.${a.column}`.localeCompare(`${b.table}.${b.column}`)
    ),
    ...enums,
  ]
}

export async function extractAll() {
  const [pkg, apiRoutes, tree] = await Promise.all([
    extractPackageJson(),
    extractApiRoutes(),
    extractDirectoryTree(),
  ])
  const features = await extractFeatures(apiRoutes)
  const schema = await extractSchema()

  return { pkg, apiRoutes, tree, features, schema }
}
