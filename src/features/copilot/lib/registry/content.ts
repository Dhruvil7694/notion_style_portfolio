import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicContent,
} from "@/features/portfolio/lib/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

const CONTENT_TYPES = [
  "blog",
  "research",
  "automation",
  "publication",
  "note",
] as const
type ContentType = (typeof CONTENT_TYPES)[number]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function revalidateContent(type?: ContentType) {
  try {
    revalidatePath("/")
    revalidatePath("/blog")
    revalidatePath("/research")
    revalidatePath("/admin/content")
  } catch {
    // best-effort
  }
  revalidatePublicContent(type)
  revalidateKnowledgeAndDiscovery()
}

// ---------- read ----------

const listContentSchema = z.object({
  type: z.enum(CONTENT_TYPES).optional().describe("Filter by content type."),
  status: z
    .enum(["draft", "published"])
    .optional()
    .describe("Filter by status."),
  limit: z.number().int().min(1).max(50).default(20),
})

type ContentRow = {
  id: string
  type: string
  slug: string
  title: string
  status: string
  tags: string[]
  published_at: string | null
  updated_at: string
}

export const listContentTool: CopilotReadTool<
  typeof listContentSchema,
  ContentRow[]
> = {
  kind: "read",
  name: "listContent",
  description:
    "List content items (blog posts, research notes, automations, publications). Use before editing or deleting.",
  inputSchema: listContentSchema,
  async execute(rawArgs) {
    const args = listContentSchema.parse(rawArgs)
    const supabase = await getAdminMutationClient()
    let query = supabase
      .from("content")
      .select("id, type, slug, title, status, tags, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(args.limit)
    if (args.type) query = query.eq("type", args.type)
    if (args.status) query = query.eq("status", args.status)
    const { data, error } = await query
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as ContentRow[] }
  },
}

const getContentSchema = z.object({
  slug: z.string().min(1).describe("Content slug."),
})

export const getContentBySlugTool: CopilotReadTool<
  typeof getContentSchema,
  Record<string, unknown>
> = {
  kind: "read",
  name: "getContentBySlug",
  description:
    "Fetch a single content item by slug — returns all metadata fields (not the rich-text body).",
  inputSchema: getContentSchema,
  async execute(rawArgs) {
    const args = getContentSchema.parse(rawArgs)
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("content")
      .select(
        "id, type, slug, title, excerpt, tags, status, ai_summary, key_takeaways, expertise_slugs, concepts, published_at, updated_at"
      )
      .eq("slug", args.slug)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: `Content "${args.slug}" not found.` }
    return { ok: true, data: data as Record<string, unknown> }
  },
}

// ---------- create ----------

const createContentSchema = z.object({
  title: z.string().min(1).max(200).describe("Content title — required."),
  type: z
    .enum(CONTENT_TYPES)
    .describe(`Content type: ${CONTENT_TYPES.join(", ")}.`),
  slug: z
    .string()
    .optional()
    .describe(
      "URL slug — auto-generated from title if not provided. Use lowercase-hyphenated format."
    ),
  excerpt: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .describe("Short teaser (max 500 chars)."),
  tags: z
    .array(z.string())
    .default([])
    .describe("Tag strings, e.g. ['RAG', 'LangChain']."),
  status: z
    .enum(["draft", "published"])
    .default("draft")
    .describe("draft or published — defaults to draft."),
  ai_summary: z.string().nullable().optional(),
  key_takeaways: z.array(z.string()).default([]),
  expertise_slugs: z.array(z.string()).default([]),
})

export const proposeCreateContentTool: CopilotProposeTool<
  typeof createContentSchema
> = {
  kind: "propose",
  name: "proposeCreateContent",
  description: `Propose creating a new content item (blog, research, automation, etc.).
The rich-text body is left empty and filled in the editor later.
Required: title, type. Defaults: status=draft, empty body.`,
  inputSchema: createContentSchema,
  async build(rawArgs) {
    const parsed = createContentSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)

    // Check slug uniqueness.
    const supabase = await getAdminMutationClient()
    const { data: existing } = await supabase
      .from("content")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (existing) {
      return {
        ok: false,
        error: `Slug "${slug}" is already taken. Suggest a different slug.`,
      }
    }

    return {
      ok: true,
      pending: {
        label: `Create ${data.type}: "${data.title}"`,
        entityLabel: `Content · ${data.type}`,
        applyTool: "applyCreateContent",
        applyArgs: { ...data, slug },
        fields: [
          { name: "Title", before: "—", after: data.title },
          { name: "Type", before: "—", after: data.type },
          { name: "Slug", before: "—", after: slug },
          { name: "Status", before: "—", after: data.status },
          { name: "Excerpt", before: "—", after: data.excerpt ?? "—" },
          { name: "Tags", before: [], after: data.tags },
        ],
        redirectUrl: "/admin/content",
        redirectLabel: "Open content list",
        proposeTool: "proposeCreateContent",
        proposeArgs: { ...data, slug },
      },
    }
  },
}

const EMPTY_TIPTAP_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

export const applyCreateContentTool: CopilotApplyTool<
  typeof createContentSchema
> = {
  kind: "apply",
  name: "applyCreateContent",
  description: "Insert a new content row with empty body.",
  inputSchema: createContentSchema,
  async execute(rawArgs) {
    const parsed = createContentSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const slug = data.slug ?? slugify(data.title)
    const supabase = await getAdminMutationClient()
    const { data: row, error } = await supabase
      .from("content")
      .insert({
        title: data.title,
        type: data.type,
        slug,
        excerpt: data.excerpt ?? null,
        tags: data.tags,
        status: data.status,
        ai_summary: data.ai_summary ?? null,
        key_takeaways: data.key_takeaways,
        expertise_slugs: data.expertise_slugs,
        content: EMPTY_TIPTAP_CONTENT,
        published_at:
          data.status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single()
    if (error) return { success: false, error: error.message }
    revalidateContent(data.type)
    return {
      success: true,
      data: {
        message: `Created ${data.type} post "${data.title}". Open the editor to write the body.`,
        redirectUrl: `/admin/content/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
        slug: row.slug,
      },
    }
  },
}

// ---------- update metadata ----------

const updateContentMetaSchema = z.object({
  slug: z
    .string()
    .min(1)
    .describe("Content slug — use listContent to find it."),
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  ai_summary: z.string().nullable().optional(),
  key_takeaways: z.array(z.string()).optional(),
  expertise_slugs: z.array(z.string()).optional(),
})

export const proposeUpdateContentMetaTool: CopilotProposeTool<
  typeof updateContentMetaSchema
> = {
  kind: "propose",
  name: "proposeUpdateContentMeta",
  description:
    "Propose metadata changes for an existing content item (title, excerpt, tags, status, ai_summary). Does NOT edit the rich-text body — use the editor for that.",
  inputSchema: updateContentMetaSchema,
  async build(rawArgs) {
    const parsed = updateContentMetaSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { slug, ...changes } = parsed.data
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("content")
      .select(
        "id, title, type, excerpt, tags, status, ai_summary, key_takeaways, expertise_slugs"
      )
      .eq("slug", slug)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current) return { ok: false, error: `Content "${slug}" not found.` }

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
        label: `Update metadata: "${current.title}"`,
        entityLabel: `Content · ${current.type}`,
        applyTool: "applyUpdateContentMeta",
        applyArgs: { slug, ...changes },
        fields,
        redirectUrl: `/admin/content/${current.id}`,
        redirectLabel: "Open in editor",
        proposeTool: "proposeUpdateContentMeta",
        proposeArgs: { slug, ...changes },
      },
    }
  },
}

export const applyUpdateContentMetaTool: CopilotApplyTool<
  typeof updateContentMetaSchema
> = {
  kind: "apply",
  name: "applyUpdateContentMeta",
  description: "Apply content metadata updates.",
  inputSchema: updateContentMetaSchema,
  async execute(rawArgs) {
    const parsed = updateContentMetaSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { slug, ...changes } = parsed.data
    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) updates[k] = v
    }
    if (changes.status === "published") {
      updates.published_at = new Date().toISOString()
    }
    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No fields to update." }
    }
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("content")
      .update(updates)
      .eq("slug", slug)
      .select("id, title, type")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: `Content "${slug}" not found.` }
    revalidateContent(data.type as ContentType)
    return {
      success: true,
      data: {
        message: `Updated "${data.title}".`,
        redirectUrl: `/admin/content/${data.id}`,
        redirectLabel: "Open in editor",
      },
    }
  },
}

// ---------- delete ----------

const deleteContentSchema = z.object({
  slug: z.string().min(1).describe("Content slug to delete."),
})

export const proposeDeleteContentTool: CopilotProposeTool<
  typeof deleteContentSchema
> = {
  kind: "propose",
  name: "proposeDeleteContent",
  description:
    "Propose permanently deleting a content item. ALWAYS confirm slug via listContent first.",
  inputSchema: deleteContentSchema,
  async build(rawArgs) {
    const parsed = deleteContentSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("content")
      .select("id, title, type, status")
      .eq("slug", parsed.data.slug)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Content "${parsed.data.slug}" not found.` }

    return {
      ok: true,
      pending: {
        label: `Delete "${current.title}"`,
        description: "This action cannot be undone.",
        entityLabel: `Content · ${current.type}`,
        applyTool: "applyDeleteContent",
        applyArgs: { slug: parsed.data.slug },
        fields: [
          { name: "Title", before: current.title, after: "(deleted)" },
          { name: "Type", before: current.type, after: "(deleted)" },
          { name: "Status", before: current.status, after: "(deleted)" },
        ],
        redirectUrl: "/admin/content",
        redirectLabel: "Open content list",
        proposeTool: "proposeDeleteContent",
        proposeArgs: { slug: parsed.data.slug },
      },
    }
  },
}

export const applyDeleteContentTool: CopilotApplyTool<
  typeof deleteContentSchema
> = {
  kind: "apply",
  name: "applyDeleteContent",
  description: "Permanently delete a content item.",
  inputSchema: deleteContentSchema,
  async execute(rawArgs) {
    const parsed = deleteContentSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data: current, error: fetchErr } = await supabase
      .from("content")
      .select("id, type")
      .eq("slug", parsed.data.slug)
      .maybeSingle()
    if (fetchErr) return { success: false, error: fetchErr.message }
    if (!current)
      return {
        success: false,
        error: `Content "${parsed.data.slug}" not found.`,
      }

    const { error } = await supabase
      .from("content")
      .delete()
      .eq("id", current.id)
    if (error) return { success: false, error: error.message }
    revalidateContent(current.type as ContentType)
    return {
      success: true,
      data: {
        message: "Content item deleted.",
        redirectUrl: "/admin/content",
        redirectLabel: "Open content list",
      },
    }
  },
}

export const contentRegistry = {
  read: {
    [listContentTool.name]: listContentTool,
    [getContentBySlugTool.name]: getContentBySlugTool,
  },
  propose: {
    [proposeCreateContentTool.name]: proposeCreateContentTool,
    [proposeUpdateContentMetaTool.name]: proposeUpdateContentMetaTool,
    [proposeDeleteContentTool.name]: proposeDeleteContentTool,
  },
  apply: {
    [applyCreateContentTool.name]: applyCreateContentTool,
    [applyUpdateContentMetaTool.name]: applyUpdateContentMetaTool,
    [applyDeleteContentTool.name]: applyDeleteContentTool,
  },
}
