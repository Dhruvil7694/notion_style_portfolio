import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicConcept,
  revalidatePublicExpertise,
  revalidatePublicTechnology,
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

function revalidateKG() {
  try {
    revalidatePath("/")
    revalidatePath("/expertise")
    revalidatePath("/admin/expertise")
    revalidatePath("/admin/technologies")
    revalidatePath("/admin/concepts")
  } catch {
    // best-effort
  }
  revalidatePublicExpertise()
  revalidatePublicTechnology()
  revalidatePublicConcept()
  revalidateKnowledgeAndDiscovery()
}

// ========================================================
// EXPERTISE AREAS
// ========================================================

const listExpertiseSchema = z.object({})

export const listExpertiseTool: CopilotReadTool<
  typeof listExpertiseSchema,
  unknown[]
> = {
  kind: "read",
  name: "listExpertiseAreas",
  description:
    "List all expertise areas (AI Engineering, RAG, Multi-Agent Systems, etc.).",
  inputSchema: listExpertiseSchema,
  async execute() {
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("expertise_areas")
      .select("id, slug, title, status, featured, display_order")
      .order("display_order", { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  },
}

const createExpertiseSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z
    .string()
    .optional()
    .describe("Auto-generated from title if not provided."),
  description: z.string().optional(),
  summary: z.string().optional(),
  why_it_matters: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  related_expertise_slugs: z.array(z.string()).default([]),
  icon_name: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
})

export const proposeCreateExpertiseTool: CopilotProposeTool<
  typeof createExpertiseSchema
> = {
  kind: "propose",
  name: "proposeCreateExpertiseArea",
  description: "Propose adding a new expertise area to the knowledge graph.",
  inputSchema: createExpertiseSchema,
  async build(rawArgs) {
    const parsed = createExpertiseSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)
    return {
      ok: true,
      pending: {
        label: `Create expertise area: "${data.title}"`,
        entityLabel: "Expertise · New",
        applyTool: "applyCreateExpertiseArea",
        applyArgs: { ...data, slug },
        fields: [
          { name: "Title", before: "—", after: data.title },
          { name: "Slug", before: "—", after: slug },
          { name: "Status", before: "—", after: data.status },
          { name: "Description", before: "—", after: data.description ?? "—" },
        ],
        redirectUrl: "/admin/expertise",
        redirectLabel: "Open expertise list",
        proposeTool: "proposeCreateExpertiseArea",
        proposeArgs: { ...data, slug },
      },
    }
  },
}

export const applyCreateExpertiseTool: CopilotApplyTool<
  typeof createExpertiseSchema
> = {
  kind: "apply",
  name: "applyCreateExpertiseArea",
  description: "Insert a new expertise area.",
  inputSchema: createExpertiseSchema,
  async execute(rawArgs) {
    const parsed = createExpertiseSchema.safeParse(rawArgs)
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
      .from("expertise_areas")
      .select("id", { count: "exact", head: true })
    const { data: row, error } = await supabase
      .from("expertise_areas")
      .insert({
        title: data.title,
        slug,
        description: data.description ?? null,
        summary: data.summary ?? null,
        why_it_matters: data.why_it_matters ?? null,
        keywords: data.keywords,
        related_expertise_slugs: data.related_expertise_slugs,
        icon_name: data.icon_name ?? null,
        featured: data.featured,
        status: data.status,
        display_order: count ?? 0,
      })
      .select("id, slug")
      .single()
    if (error) return { success: false, error: error.message }
    revalidateKG()
    return {
      success: true,
      data: {
        message: `Created expertise area "${data.title}".`,
        redirectUrl: `/admin/expertise/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
      },
    }
  },
}

const updateExpertiseSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("Expertise area ID — use listExpertiseAreas to find it."),
  title: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  why_it_matters: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  related_expertise_slugs: z.array(z.string()).optional(),
  icon_name: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
})

export const proposeUpdateExpertiseTool: CopilotProposeTool<
  typeof updateExpertiseSchema
> = {
  kind: "propose",
  name: "proposeUpdateExpertiseArea",
  description: "Propose changes to an expertise area.",
  inputSchema: updateExpertiseSchema,
  async build(rawArgs) {
    const parsed = updateExpertiseSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { id, ...changes } = parsed.data
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("expertise_areas")
      .select(
        "title, description, summary, status, featured, keywords, icon_name"
      )
      .eq("id", id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current) return { ok: false, error: `Expertise area ${id} not found.` }
    const fields = Object.entries(changes)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => ({
        name: key,
        key,
        before: (current as Record<string, unknown>)[key],
        after: value,
      }))
    if (fields.length === 0) return { ok: false, error: "No fields to update." }
    return {
      ok: true,
      pending: {
        label: `Update expertise: "${current.title}"`,
        entityLabel: `Expertise · ${current.title}`,
        applyTool: "applyUpdateExpertiseArea",
        applyArgs: { id, ...changes },
        fields,
        redirectUrl: `/admin/expertise/${id}`,
        redirectLabel: "Open in editor",
        proposeTool: "proposeUpdateExpertiseArea",
        proposeArgs: { id, ...changes },
      },
    }
  },
}

export const applyUpdateExpertiseTool: CopilotApplyTool<
  typeof updateExpertiseSchema
> = {
  kind: "apply",
  name: "applyUpdateExpertiseArea",
  description: "Apply expertise area updates.",
  inputSchema: updateExpertiseSchema,
  async execute(rawArgs) {
    const parsed = updateExpertiseSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { id, ...changes } = parsed.data
    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) updates[k] = v
    }
    if (Object.keys(updates).length === 0)
      return { success: false, error: "No fields to update." }
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("expertise_areas")
      .update(updates)
      .eq("id", id)
      .select("title")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (!data)
      return { success: false, error: `Expertise area ${id} not found.` }
    revalidateKG()
    return {
      success: true,
      data: {
        message: `Updated expertise area "${data.title}".`,
        redirectUrl: `/admin/expertise/${id}`,
        redirectLabel: "Open in editor",
      },
    }
  },
}

// ========================================================
// TECHNOLOGY REGISTRY
// ========================================================

const listTechSchema = z.object({})

export const listTechnologiesTool: CopilotReadTool<
  typeof listTechSchema,
  unknown[]
> = {
  kind: "read",
  name: "listTechnologies",
  description:
    "List all technology registry entries (LangGraph, FastAPI, etc.).",
  inputSchema: listTechSchema,
  async execute() {
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("technology_registry")
      .select("id, slug, title, category, status, featured")
      .order("display_order", { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  },
}

const createTechSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional().describe("Auto-generated from title if omitted."),
  description: z.string().optional(),
  summary: z.string().optional(),
  category: z
    .string()
    .optional()
    .describe("E.g. framework, database, cloud, ai_ml."),
  website_url: z.string().url().nullable().optional(),
  documentation_url: z.string().url().nullable().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
})

export const proposeCreateTechnologyTool: CopilotProposeTool<
  typeof createTechSchema
> = {
  kind: "propose",
  name: "proposeCreateTechnology",
  description: "Propose adding a new technology to the registry.",
  inputSchema: createTechSchema,
  async build(rawArgs) {
    const parsed = createTechSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)
    return {
      ok: true,
      pending: {
        label: `Add technology: "${data.title}"`,
        entityLabel: "Technology · New",
        applyTool: "applyCreateTechnology",
        applyArgs: { ...data, slug },
        fields: [
          { name: "Title", before: "—", after: data.title },
          { name: "Category", before: "—", after: data.category ?? "—" },
          { name: "Status", before: "—", after: data.status },
        ],
        redirectUrl: "/admin/technologies",
        redirectLabel: "Open technology list",
        proposeTool: "proposeCreateTechnology",
        proposeArgs: { ...data, slug },
      },
    }
  },
}

export const applyCreateTechnologyTool: CopilotApplyTool<
  typeof createTechSchema
> = {
  kind: "apply",
  name: "applyCreateTechnology",
  description: "Insert a new technology registry entry.",
  inputSchema: createTechSchema,
  async execute(rawArgs) {
    const parsed = createTechSchema.safeParse(rawArgs)
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
      .from("technology_registry")
      .select("id", { count: "exact", head: true })
    const { data: row, error } = await supabase
      .from("technology_registry")
      .insert({
        title: data.title,
        slug,
        description: data.description ?? null,
        summary: data.summary ?? null,
        category: data.category ?? null,
        website_url: data.website_url ?? null,
        documentation_url: data.documentation_url ?? null,
        featured: data.featured,
        status: data.status,
        display_order: count ?? 0,
      })
      .select("id")
      .single()
    if (error) return { success: false, error: error.message }
    revalidateKG()
    return {
      success: true,
      data: {
        message: `Added "${data.title}" to the technology registry.`,
        redirectUrl: `/admin/technologies/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
      },
    }
  },
}

// ========================================================
// CONCEPT REGISTRY
// ========================================================

const listConceptsSchema = z.object({})

export const listConceptsTool: CopilotReadTool<
  typeof listConceptsSchema,
  unknown[]
> = {
  kind: "read",
  name: "listConcepts",
  description:
    "List all concept registry entries (Hybrid Retrieval, Agent Memory, etc.).",
  inputSchema: listConceptsSchema,
  async execute() {
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("concept_registry")
      .select("id, slug, title, status, featured")
      .order("display_order", { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data ?? [] }
  },
}

const createConceptSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional().describe("Auto-generated from title if omitted."),
  description: z.string().optional(),
  summary: z.string().optional(),
  why_it_matters: z.string().optional(),
  related_concept_slugs: z.array(z.string()).default([]),
  related_expertise_slugs: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
})

export const proposeCreateConceptTool: CopilotProposeTool<
  typeof createConceptSchema
> = {
  kind: "propose",
  name: "proposeCreateConcept",
  description: "Propose adding a new concept to the concept registry.",
  inputSchema: createConceptSchema,
  async build(rawArgs) {
    const parsed = createConceptSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)
    return {
      ok: true,
      pending: {
        label: `Add concept: "${data.title}"`,
        entityLabel: "Concept · New",
        applyTool: "applyCreateConcept",
        applyArgs: { ...data, slug },
        fields: [
          { name: "Title", before: "—", after: data.title },
          { name: "Status", before: "—", after: data.status },
          { name: "Description", before: "—", after: data.description ?? "—" },
        ],
        redirectUrl: "/admin/concepts",
        redirectLabel: "Open concept list",
        proposeTool: "proposeCreateConcept",
        proposeArgs: { ...data, slug },
      },
    }
  },
}

export const applyCreateConceptTool: CopilotApplyTool<
  typeof createConceptSchema
> = {
  kind: "apply",
  name: "applyCreateConcept",
  description: "Insert a new concept registry entry.",
  inputSchema: createConceptSchema,
  async execute(rawArgs) {
    const parsed = createConceptSchema.safeParse(rawArgs)
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
      .from("concept_registry")
      .select("id", { count: "exact", head: true })
    const { data: row, error } = await supabase
      .from("concept_registry")
      .insert({
        title: data.title,
        slug,
        description: data.description ?? null,
        summary: data.summary ?? null,
        why_it_matters: data.why_it_matters ?? null,
        related_concept_slugs: data.related_concept_slugs,
        related_expertise_slugs: data.related_expertise_slugs,
        featured: data.featured,
        status: data.status,
        display_order: count ?? 0,
      })
      .select("id")
      .single()
    if (error) return { success: false, error: error.message }
    revalidateKG()
    return {
      success: true,
      data: {
        message: `Added concept "${data.title}".`,
        redirectUrl: `/admin/concepts/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
      },
    }
  },
}

export const knowledgeGraphRegistry = {
  read: {
    [listExpertiseTool.name]: listExpertiseTool,
    [listTechnologiesTool.name]: listTechnologiesTool,
    [listConceptsTool.name]: listConceptsTool,
  },
  propose: {
    [proposeCreateExpertiseTool.name]: proposeCreateExpertiseTool,
    [proposeUpdateExpertiseTool.name]: proposeUpdateExpertiseTool,
    [proposeCreateTechnologyTool.name]: proposeCreateTechnologyTool,
    [proposeCreateConceptTool.name]: proposeCreateConceptTool,
  },
  apply: {
    [applyCreateExpertiseTool.name]: applyCreateExpertiseTool,
    [applyUpdateExpertiseTool.name]: applyUpdateExpertiseTool,
    [applyCreateTechnologyTool.name]: applyCreateTechnologyTool,
    [applyCreateConceptTool.name]: applyCreateConceptTool,
  },
}
