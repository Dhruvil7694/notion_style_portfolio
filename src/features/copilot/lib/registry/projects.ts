import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import { syncSkillsFromTechStack } from "@/features/admin/lib/sync-skills-from-tech-stack"
import { parseFaqItems } from "@/features/knowledge-base/lib/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicProjects,
} from "@/features/portfolio/lib/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const PROJECT_TEXT_FIELDS = [
  "summary",
  "tagline",
  "ai_summary",
  "problem",
  "why_built",
  "approach",
  "overview",
  "challenge",
  "solution",
  "impact",
] as const

const PROJECT_ARRAY_FIELDS = [
  "key_takeaways",
  "tech_stack",
  "technologies",
  "concepts",
  "expertise_slugs",
] as const

const PROJECT_JSON_FIELDS = ["faq", "tradeoffs"] as const

type ProjectTextField = (typeof PROJECT_TEXT_FIELDS)[number]
type ProjectArrayField = (typeof PROJECT_ARRAY_FIELDS)[number]
type ProjectJsonField = (typeof PROJECT_JSON_FIELDS)[number]

function revalidateProjects(slug?: string) {
  try {
    revalidatePath("/")
    revalidatePath("/projects")
    if (slug) revalidatePath(`/projects/${slug}`)
    revalidatePath("/admin/projects")
  } catch {
    // best-effort
  }
  revalidatePublicProjects(slug)
  revalidateKnowledgeAndDiscovery()
}

// ---------- read ----------

const listProjectsSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  search: z.string().optional().describe("Substring match against title."),
  limit: z.number().int().min(1).max(50).default(20),
})

type ProjectListRow = {
  id: string
  slug: string
  title: string
  status: string
  summary: string | null
  featured: boolean
  updated_at: string
}

export const listProjectsTool: CopilotReadTool<
  typeof listProjectsSchema,
  ProjectListRow[]
> = {
  kind: "read",
  name: "listProjects",
  description:
    "List projects with optional status filter. Use before proposing project edits to find the right slug.",
  inputSchema: listProjectsSchema,
  async execute(rawArgs) {
    const args = listProjectsSchema.parse(rawArgs)
    const supabase = await getAdminMutationClient()
    let query = supabase
      .from("projects")
      .select("id, slug, title, status, summary, featured, updated_at")
      .order("updated_at", { ascending: false })
      .limit(args.limit)

    if (args.status) query = query.eq("status", args.status)
    if (args.search) query = query.ilike("title", `%${args.search}%`)

    const { data, error } = await query
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as ProjectListRow[] }
  },
}

const getProjectSchema = z.object({
  slug: z.string().min(1).describe("Project slug."),
})

export const getProjectTool: CopilotReadTool<
  typeof getProjectSchema,
  Record<string, unknown>
> = {
  kind: "read",
  name: "getProjectBySlug",
  description:
    "Fetch a project by slug with all editable fields. Use before proposing field updates so previews are grounded.",
  inputSchema: getProjectSchema,
  async execute(rawArgs) {
    const args = getProjectSchema.parse(rawArgs)
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, slug, title, status, summary, tagline, ai_summary, problem, why_built, approach, overview, challenge, solution, impact, key_takeaways, tech_stack, technologies, concepts, expertise_slugs, faq, tradeoffs"
      )
      .eq("slug", args.slug)
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: `Project ${args.slug} not found.` }
    return { ok: true, data: data as Record<string, unknown> }
  },
}

// ---------- propose: update project field ----------

const proposeProjectFieldSchema = z.object({
  slug: z.string().min(1),
  field: z
    .string()
    .describe(
      `Which project field to update. Allowed: ${[
        ...PROJECT_TEXT_FIELDS,
        ...PROJECT_ARRAY_FIELDS,
        ...PROJECT_JSON_FIELDS,
      ].join(", ")}.`
    ),
  value: z
    .union([
      z.string(),
      z.array(z.unknown()),
      z.record(z.string(), z.unknown()),
    ])
    .describe(
      "New value. String for text fields, array for tech_stack/key_takeaways/technologies/concepts/expertise_slugs, array of {question, answer} for faq, array of {decision, alternative, reason} for tradeoffs."
    ),
})

function isTextField(field: string): field is ProjectTextField {
  return (PROJECT_TEXT_FIELDS as readonly string[]).includes(field)
}
function isArrayField(field: string): field is ProjectArrayField {
  return (PROJECT_ARRAY_FIELDS as readonly string[]).includes(field)
}
function isJsonField(field: string): field is ProjectJsonField {
  return (PROJECT_JSON_FIELDS as readonly string[]).includes(field)
}

export const proposeProjectFieldTool: CopilotProposeTool<
  typeof proposeProjectFieldSchema
> = {
  kind: "propose",
  name: "proposeProjectFieldUpdate",
  description:
    "Propose replacing a single project field. Use for summary, tagline, ai_summary, faq, key_takeaways, tradeoffs, tech_stack, technologies, concepts, expertise_slugs, and the case-study text fields.",
  inputSchema: proposeProjectFieldSchema,
  async build(rawArgs) {
    const parsed = proposeProjectFieldSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { slug, field, value } = parsed.data

    if (!isTextField(field) && !isArrayField(field) && !isJsonField(field)) {
      return {
        ok: false,
        error: `Unsupported project field: ${field}`,
      }
    }

    // Validate value shape against field kind.
    if (isTextField(field) && typeof value !== "string") {
      return { ok: false, error: `Field ${field} expects a string.` }
    }
    if (isArrayField(field) && !Array.isArray(value)) {
      return { ok: false, error: `Field ${field} expects an array.` }
    }
    if (field === "faq") {
      const items = parseFaqItems(value)
      if (items.length === 0) {
        return {
          ok: false,
          error: "FAQ must be a non-empty array of {question, answer} objects.",
        }
      }
    }
    if (field === "tradeoffs" && !Array.isArray(value)) {
      return {
        ok: false,
        error: "tradeoffs expects an array of {decision, alternative, reason}.",
      }
    }

    const supabase = await getAdminMutationClient()
    const { data: project, error } = await supabase
      .from("projects")
      .select(`id, slug, title, ${field}`)
      .eq("slug", slug)
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!project) return { ok: false, error: `Project ${slug} not found.` }

    const currentValue = (project as Record<string, unknown>)[field] ?? null

    return {
      ok: true,
      pending: {
        label: `Update ${field} on "${(project as { title?: string }).title ?? slug}"`,
        description: "Confirm to save this field change.",
        entityLabel: `Project · ${(project as { title?: string }).title ?? slug}`,
        applyTool: "applyProjectFieldUpdate",
        applyArgs: { slug, field, value },
        fields: [
          {
            name: field,
            key: field,
            before: currentValue,
            after: value,
          },
        ],
        redirectUrl: `/projects/${slug}`,
        redirectLabel: "Open project page",
        proposeTool: "proposeProjectFieldUpdate",
        proposeArgs: { slug, field, value },
      },
    }
  },
}

// ---------- apply ----------

const applyProjectFieldSchema = proposeProjectFieldSchema

export const applyProjectFieldTool: CopilotApplyTool<
  typeof applyProjectFieldSchema
> = {
  kind: "apply",
  name: "applyProjectFieldUpdate",
  description: "Write a single project field by slug.",
  inputSchema: applyProjectFieldSchema,
  async execute(rawArgs) {
    const parsed = applyProjectFieldSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { slug, field, value } = parsed.data

    let normalized: unknown = value
    if (field === "faq") normalized = parseFaqItems(value)

    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("projects")
      .update({ [field]: normalized })
      .eq("slug", slug)
      .select(`id, slug, title, ${field}`)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: `Project ${slug} not found.` }

    // Read-after-write verify for text fields.
    if (typeof normalized === "string") {
      const { data: verify } = await supabase
        .from("projects")
        .select(field)
        .eq("slug", slug)
        .maybeSingle()
      const persisted = (verify as Record<string, unknown> | null)?.[field]
      if (persisted !== normalized) {
        return {
          success: false,
          error:
            "Save reported OK but the database still shows the old value. Nothing applied.",
        }
      }
    }

    revalidateProjects(slug)
    return {
      success: true,
      data: {
        message: `Updated ${field} on "${(data as { title?: string }).title ?? slug}".`,
        redirectUrl: `/projects/${slug}`,
        redirectLabel: "Open project page",
      },
    }
  },
}

// ========================================================
// CREATE PROJECT
// ========================================================

const createProjectSchema = z.object({
  title: z.string().min(1).max(200).describe("Project title — required."),
  summary: z
    .string()
    .min(1)
    .max(500)
    .describe("One-paragraph summary of the project — required."),
  slug: z
    .string()
    .optional()
    .describe("URL slug — auto-generated from title if omitted."),
  category: z
    .string()
    .optional()
    .describe("E.g. 'AI Engineering', 'RAG', 'Automation'."),
  role: z.string().optional().describe("Your role, e.g. 'Lead Engineer'."),
  year: z.string().optional().describe("Year, e.g. '2024'."),
  github_url: z.string().url().nullable().optional(),
  live_url: z.string().url().nullable().optional(),
  tech_stack: z
    .array(z.string())
    .default([])
    .describe("Technologies used (one per item)."),
  featured: z.boolean().default(false),
  status: z
    .enum(["draft", "published"])
    .default("draft")
    .describe("draft or published — defaults to draft."),
})

export const proposeCreateProjectTool: CopilotProposeTool<
  typeof createProjectSchema
> = {
  kind: "propose",
  name: "proposeCreateProject",
  description: `Propose creating a new project entry.
Required: title, summary. Optional: slug (auto-generated), category, role, year, github_url, live_url, tech_stack, featured, status.
The rich-text case study content (problem, approach, impact, etc.) is edited in the admin editor after creation.`,
  inputSchema: createProjectSchema,
  async build(rawArgs) {
    const parsed = createProjectSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)

    const supabase = await getAdminMutationClient()
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (existing) {
      return {
        ok: false,
        error: `Slug "${slug}" is already taken. Suggest a different slug or title.`,
      }
    }

    return {
      ok: true,
      pending: {
        label: `Create project: "${data.title}"`,
        entityLabel: "Project · New",
        applyTool: "applyCreateProject",
        applyArgs: { ...data, slug },
        fields: [
          { name: "Title", before: "—", after: data.title },
          { name: "Slug", before: "—", after: slug },
          { name: "Summary", before: "—", after: data.summary },
          { name: "Category", before: "—", after: data.category ?? "—" },
          { name: "Status", before: "—", after: data.status },
          { name: "Tech stack", before: [], after: data.tech_stack },
        ],
        redirectUrl: "/admin/projects",
        redirectLabel: "Open projects list",
        proposeTool: "proposeCreateProject",
        proposeArgs: { ...data, slug },
      },
    }
  },
}

export const applyCreateProjectTool: CopilotApplyTool<
  typeof createProjectSchema
> = {
  kind: "apply",
  name: "applyCreateProject",
  description: "Insert a new project row.",
  inputSchema: createProjectSchema,
  async execute(rawArgs) {
    const parsed = createProjectSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)
    const supabase = await getAdminMutationClient()
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
    const { data: row, error } = await supabase
      .from("projects")
      .insert({
        title: data.title,
        slug,
        summary: data.summary,
        category: data.category ?? null,
        role: data.role ?? null,
        year: data.year ?? null,
        github_url: data.github_url ?? null,
        live_url: data.live_url ?? null,
        project_url: data.live_url ?? null,
        tech_stack: data.tech_stack,
        featured: data.featured,
        status: data.status,
        display_order: count ?? 0,
        published_at:
          data.status === "published" ? new Date().toISOString() : null,
        content: { type: "doc", content: [{ type: "paragraph" }] },
      })
      .select("id, slug")
      .single()
    if (error) return { success: false, error: error.message }
    if (data.tech_stack.length > 0) {
      try {
        await syncSkillsFromTechStack(supabase, data.tech_stack)
      } catch {
        // best-effort
      }
    }
    revalidateProjects(slug)
    return {
      success: true,
      data: {
        message: `Created project "${data.title}". Open the editor to add the full case study.`,
        redirectUrl: `/admin/projects/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
        slug: row.slug,
      },
    }
  },
}

// ========================================================
// ARCHIVE PROJECT (soft delete)
// ========================================================

const archiveProjectSchema = z.object({
  slug: z.string().min(1).describe("Project slug to archive."),
})

export const proposeArchiveProjectTool: CopilotProposeTool<
  typeof archiveProjectSchema
> = {
  kind: "propose",
  name: "proposeArchiveProject",
  description:
    "Propose archiving a project (sets status to 'archived', removes it from public pages). Use instead of deleting — safer and reversible.",
  inputSchema: archiveProjectSchema,
  async build(rawArgs) {
    const parsed = archiveProjectSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("projects")
      .select("id, title, status")
      .eq("slug", parsed.data.slug)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Project "${parsed.data.slug}" not found.` }
    if (current.status === "archived") {
      return {
        ok: false,
        error: `Project "${current.title}" is already archived.`,
      }
    }
    return {
      ok: true,
      pending: {
        label: `Archive "${current.title}"`,
        description:
          "Sets status to archived — hidden from public, stays in the DB.",
        entityLabel: `Project · ${current.title}`,
        applyTool: "applyArchiveProject",
        applyArgs: { slug: parsed.data.slug },
        fields: [
          {
            name: "Status",
            before: current.status,
            after: "archived",
          },
        ],
        redirectUrl: "/admin/projects",
        redirectLabel: "Open projects list",
        proposeTool: "proposeArchiveProject",
        proposeArgs: { slug: parsed.data.slug },
      },
    }
  },
}

export const applyArchiveProjectTool: CopilotApplyTool<
  typeof archiveProjectSchema
> = {
  kind: "apply",
  name: "applyArchiveProject",
  description: "Set project status to 'archived'.",
  inputSchema: archiveProjectSchema,
  async execute(rawArgs) {
    const parsed = archiveProjectSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("projects")
      .update({ status: "archived" })
      .eq("slug", parsed.data.slug)
      .select("id, title")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (!data)
      return {
        success: false,
        error: `Project "${parsed.data.slug}" not found.`,
      }
    revalidateProjects(parsed.data.slug)
    return {
      success: true,
      data: {
        message: `"${data.title}" is now archived and hidden from the public site.`,
        redirectUrl: "/admin/projects",
        redirectLabel: "Open projects list",
      },
    }
  },
}

export const projectsRegistry = {
  read: {
    [listProjectsTool.name]: listProjectsTool,
    [getProjectTool.name]: getProjectTool,
  },
  propose: {
    [proposeProjectFieldTool.name]: proposeProjectFieldTool,
    [proposeCreateProjectTool.name]: proposeCreateProjectTool,
    [proposeArchiveProjectTool.name]: proposeArchiveProjectTool,
  },
  apply: {
    [applyProjectFieldTool.name]: applyProjectFieldTool,
    [applyCreateProjectTool.name]: applyCreateProjectTool,
    [applyArchiveProjectTool.name]: applyArchiveProjectTool,
  },
}
