import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import { revalidatePublicEducation } from "@/features/portfolio/lib/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

function revalidateEdu() {
  try {
    revalidatePath("/")
    revalidatePath("/education")
    revalidatePath("/admin/education")
  } catch {
    // best-effort
  }
  revalidatePublicEducation()
}

// ---------- read ----------

const listEduSchema = z.object({})

type EducationRow = {
  id: string
  institution: string
  degree: string
  description: string | null
}

export const listEducationTool: CopilotReadTool<
  typeof listEduSchema,
  EducationRow[]
> = {
  kind: "read",
  name: "listEducation",
  description:
    "List all education entries. Use before updating or deleting to find the correct ID.",
  inputSchema: listEduSchema,
  async execute() {
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("education")
      .select("id, institution, degree, description")
      .order("created_at", { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as EducationRow[] }
  },
}

// ---------- create ----------

const createEduSchema = z.object({
  institution: z
    .string()
    .min(1)
    .describe("University, bootcamp, or institution name."),
  degree: z.string().min(1).describe("Degree, certification, or course name."),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Optional short description or note about the education."),
})

export const proposeCreateEducationTool: CopilotProposeTool<
  typeof createEduSchema
> = {
  kind: "propose",
  name: "proposeCreateEducation",
  description:
    "Propose adding a new education entry. Required: institution, degree.",
  inputSchema: createEduSchema,
  async build(rawArgs) {
    const parsed = createEduSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    return {
      ok: true,
      pending: {
        label: `Add "${data.degree}" at ${data.institution}`,
        entityLabel: "Education · New entry",
        applyTool: "applyCreateEducation",
        applyArgs: { ...data },
        fields: [
          { name: "Institution", before: "—", after: data.institution },
          { name: "Degree", before: "—", after: data.degree },
          { name: "Description", before: "—", after: data.description ?? "—" },
        ],
        redirectUrl: "/admin/education",
        redirectLabel: "Open education list",
        proposeTool: "proposeCreateEducation",
        proposeArgs: { ...data },
      },
    }
  },
}

export const applyCreateEducationTool: CopilotApplyTool<
  typeof createEduSchema
> = {
  kind: "apply",
  name: "applyCreateEducation",
  description: "Insert a new education row.",
  inputSchema: createEduSchema,
  async execute(rawArgs) {
    const parsed = createEduSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const supabase = await getAdminMutationClient()
    const { data: row, error } = await supabase
      .from("education")
      .insert({
        institution: data.institution,
        degree: data.degree,
        description: data.description ?? null,
      })
      .select("id")
      .single()
    if (error) return { success: false, error: error.message }
    revalidateEdu()
    return {
      success: true,
      data: {
        message: `Added "${data.degree}" at ${data.institution}.`,
        redirectUrl: `/admin/education/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
      },
    }
  },
}

// ---------- update ----------

const updateEduSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("Education entry ID — use listEducation to find it."),
  institution: z.string().min(1).optional(),
  degree: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export const proposeUpdateEducationTool: CopilotProposeTool<
  typeof updateEduSchema
> = {
  kind: "propose",
  name: "proposeUpdateEducation",
  description:
    "Propose changes to an existing education entry by ID. Only include fields that should change.",
  inputSchema: updateEduSchema,
  async build(rawArgs) {
    const parsed = updateEduSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { id, ...changes } = parsed.data
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("education")
      .select("institution, degree, description")
      .eq("id", id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Education entry ${id} not found.` }

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
        label: `Update "${current.degree}" at ${current.institution}`,
        entityLabel: `Education · ${current.institution}`,
        applyTool: "applyUpdateEducation",
        applyArgs: { id, ...changes },
        fields,
        redirectUrl: `/admin/education/${id}`,
        redirectLabel: "Open in editor",
        proposeTool: "proposeUpdateEducation",
        proposeArgs: { id, ...changes },
      },
    }
  },
}

export const applyUpdateEducationTool: CopilotApplyTool<
  typeof updateEduSchema
> = {
  kind: "apply",
  name: "applyUpdateEducation",
  description: "Apply education entry updates.",
  inputSchema: updateEduSchema,
  async execute(rawArgs) {
    const parsed = updateEduSchema.safeParse(rawArgs)
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
    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No fields to update." }
    }
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("education")
      .update(updates)
      .eq("id", id)
      .select("institution, degree")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: `Education ${id} not found.` }
    revalidateEdu()
    return {
      success: true,
      data: {
        message: `Updated "${data.degree}" at ${data.institution}.`,
        redirectUrl: `/admin/education/${id}`,
        redirectLabel: "Open in editor",
      },
    }
  },
}

// ---------- delete ----------

const deleteEduSchema = z.object({
  id: z.string().uuid().describe("Education entry ID to delete."),
})

export const proposeDeleteEducationTool: CopilotProposeTool<
  typeof deleteEduSchema
> = {
  kind: "propose",
  name: "proposeDeleteEducation",
  description:
    "Propose permanently deleting an education entry. ALWAYS call listEducation first to confirm the correct ID.",
  inputSchema: deleteEduSchema,
  async build(rawArgs) {
    const parsed = deleteEduSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("education")
      .select("institution, degree")
      .eq("id", parsed.data.id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Education ${parsed.data.id} not found.` }

    return {
      ok: true,
      pending: {
        label: `Delete "${current.degree}" at ${current.institution}`,
        description: "This action cannot be undone.",
        entityLabel: `Education · ${current.institution}`,
        applyTool: "applyDeleteEducation",
        applyArgs: { id: parsed.data.id },
        fields: [
          {
            name: "Institution",
            before: current.institution,
            after: "(deleted)",
          },
          { name: "Degree", before: current.degree, after: "(deleted)" },
        ],
        redirectUrl: "/admin/education",
        redirectLabel: "Open education list",
        proposeTool: "proposeDeleteEducation",
        proposeArgs: { id: parsed.data.id },
      },
    }
  },
}

export const applyDeleteEducationTool: CopilotApplyTool<
  typeof deleteEduSchema
> = {
  kind: "apply",
  name: "applyDeleteEducation",
  description: "Permanently delete an education entry.",
  inputSchema: deleteEduSchema,
  async execute(rawArgs) {
    const parsed = deleteEduSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { error } = await supabase
      .from("education")
      .delete()
      .eq("id", parsed.data.id)
    if (error) return { success: false, error: error.message }
    revalidateEdu()
    return {
      success: true,
      data: {
        message: "Education entry deleted.",
        redirectUrl: "/admin/education",
        redirectLabel: "Open education list",
      },
    }
  },
}

export const educationRegistry = {
  read: { [listEducationTool.name]: listEducationTool },
  propose: {
    [proposeCreateEducationTool.name]: proposeCreateEducationTool,
    [proposeUpdateEducationTool.name]: proposeUpdateEducationTool,
    [proposeDeleteEducationTool.name]: proposeDeleteEducationTool,
  },
  apply: {
    [applyCreateEducationTool.name]: applyCreateEducationTool,
    [applyUpdateEducationTool.name]: applyUpdateEducationTool,
    [applyDeleteEducationTool.name]: applyDeleteEducationTool,
  },
}
