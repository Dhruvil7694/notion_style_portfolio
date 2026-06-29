import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import { syncSkillsFromTechStack } from "@/features/admin/lib/sync-skills-from-tech-stack"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicExperience,
  revalidatePublicSkills,
} from "@/features/portfolio/lib/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

function revalidateExp() {
  try {
    revalidatePath("/")
    revalidatePath("/experience")
    revalidatePath("/admin/experience")
  } catch {
    // best-effort
  }
  revalidatePublicExperience()
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
}

// ---------- read ----------

const listExpSchema = z.object({})

type ExperienceRow = {
  id: string
  company: string
  role: string
  start_date: string
  end_date: string | null
  location: string | null
}

export const listExperienceTool: CopilotReadTool<
  typeof listExpSchema,
  ExperienceRow[]
> = {
  kind: "read",
  name: "listExperience",
  description:
    "List all work experience entries ordered by display order. Use before updating or deleting to find the correct ID.",
  inputSchema: listExpSchema,
  async execute() {
    const supabase = await getAdminMutationClient()
    const { data, error } = await supabase
      .from("experience")
      .select("id, company, role, start_date, end_date, location")
      .order("display_order", { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as ExperienceRow[] }
  },
}

// ---------- create ----------

const createExpSchema = z.object({
  company: z.string().min(1).describe("Company or organisation name."),
  role: z.string().min(1).describe("Job title / role."),
  start_date: z
    .string()
    .min(1)
    .describe("Start date in YYYY-MM format, e.g. 2022-06."),
  end_date: z
    .string()
    .nullable()
    .optional()
    .describe("End date in YYYY-MM format, or null if this is a current role."),
  location: z.string().nullable().optional(),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Short paragraph about the role."),
  achievements: z
    .array(z.string())
    .default([])
    .describe("Key accomplishments — one string per bullet."),
  tech_stack: z
    .array(z.string())
    .default([])
    .describe("Technologies used (one per array item)."),
})

export const proposeCreateExperienceTool: CopilotProposeTool<
  typeof createExpSchema
> = {
  kind: "propose",
  name: "proposeCreateExperience",
  description:
    "Propose adding a new work experience entry. Required: company, role, start_date.",
  inputSchema: createExpSchema,
  async build(rawArgs) {
    const parsed = createExpSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const period = data.end_date
      ? `${data.start_date} – ${data.end_date}`
      : `${data.start_date} – Present`
    return {
      ok: true,
      pending: {
        label: `Add "${data.role}" at ${data.company}`,
        description: period,
        entityLabel: "Experience · New entry",
        applyTool: "applyCreateExperience",
        applyArgs: { ...data },
        fields: [
          { name: "Company", before: "—", after: data.company },
          { name: "Role", before: "—", after: data.role },
          { name: "Period", before: "—", after: period },
          { name: "Location", before: "—", after: data.location ?? "—" },
          { name: "Description", before: "—", after: data.description ?? "—" },
          { name: "Achievements", before: [], after: data.achievements },
          { name: "Tech stack", before: [], after: data.tech_stack },
        ],
        redirectUrl: "/admin/experience",
        redirectLabel: "Open experience list",
        proposeTool: "proposeCreateExperience",
        proposeArgs: { ...data },
      },
    }
  },
}

export const applyCreateExperienceTool: CopilotApplyTool<
  typeof createExpSchema
> = {
  kind: "apply",
  name: "applyCreateExperience",
  description: "Insert a new work experience row.",
  inputSchema: createExpSchema,
  async execute(rawArgs) {
    const parsed = createExpSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const supabase = await getAdminMutationClient()
    const { count } = await supabase
      .from("experience")
      .select("id", { count: "exact", head: true })
    const { data: row, error } = await supabase
      .from("experience")
      .insert({
        company: data.company,
        role: data.role,
        location: data.location ?? null,
        start_date: data.start_date,
        end_date: data.end_date ?? null,
        description: data.description ?? null,
        achievements: data.achievements,
        tech_stack: data.tech_stack,
        display_order: count ?? 0,
      })
      .select("id")
      .single()
    if (error) return { success: false, error: error.message }
    if (data.tech_stack.length > 0) {
      try {
        await syncSkillsFromTechStack(supabase, data.tech_stack)
      } catch {
        // best-effort skill sync
      }
    }
    revalidateExp()
    return {
      success: true,
      data: {
        message: `Added "${data.role}" at ${data.company}.`,
        redirectUrl: `/admin/experience/${row.id}`,
        redirectLabel: "Open in editor",
        id: row.id,
      },
    }
  },
}

// ---------- update ----------

const updateExpSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("Experience entry ID — use listExperience to find it."),
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  start_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  achievements: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
})

export const proposeUpdateExperienceTool: CopilotProposeTool<
  typeof updateExpSchema
> = {
  kind: "propose",
  name: "proposeUpdateExperience",
  description:
    "Propose changes to an existing experience entry by ID. Only include fields that should change.",
  inputSchema: updateExpSchema,
  async build(rawArgs) {
    const parsed = updateExpSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { id, ...changes } = parsed.data
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("experience")
      .select(
        "company, role, start_date, end_date, location, description, achievements, tech_stack"
      )
      .eq("id", id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Experience entry ${id} not found.` }

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
        label: `Update "${current.role}" at ${current.company}`,
        entityLabel: `Experience · ${current.company}`,
        applyTool: "applyUpdateExperience",
        applyArgs: { id, ...changes },
        fields,
        redirectUrl: `/admin/experience/${id}`,
        redirectLabel: "Open in editor",
        proposeTool: "proposeUpdateExperience",
        proposeArgs: { id, ...changes },
      },
    }
  },
}

export const applyUpdateExperienceTool: CopilotApplyTool<
  typeof updateExpSchema
> = {
  kind: "apply",
  name: "applyUpdateExperience",
  description: "Apply experience entry updates.",
  inputSchema: updateExpSchema,
  async execute(rawArgs) {
    const parsed = updateExpSchema.safeParse(rawArgs)
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
      .from("experience")
      .update(updates)
      .eq("id", id)
      .select("company, role")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: `Experience ${id} not found.` }
    if (changes.tech_stack && changes.tech_stack.length > 0) {
      try {
        await syncSkillsFromTechStack(supabase, changes.tech_stack)
      } catch {
        // best-effort
      }
    }
    revalidateExp()
    return {
      success: true,
      data: {
        message: `Updated "${data.role}" at ${data.company}.`,
        redirectUrl: `/admin/experience/${id}`,
        redirectLabel: "Open in editor",
      },
    }
  },
}

// ---------- delete ----------

const deleteExpSchema = z.object({
  id: z.string().uuid().describe("Experience entry ID to delete."),
})

export const proposeDeleteExperienceTool: CopilotProposeTool<
  typeof deleteExpSchema
> = {
  kind: "propose",
  name: "proposeDeleteExperience",
  description:
    "Propose permanently deleting a work experience entry. ALWAYS call listExperience first to confirm the correct ID.",
  inputSchema: deleteExpSchema,
  async build(rawArgs) {
    const parsed = deleteExpSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("experience")
      .select("company, role, start_date, end_date")
      .eq("id", parsed.data.id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Experience ${parsed.data.id} not found.` }

    return {
      ok: true,
      pending: {
        label: `Delete "${current.role}" at ${current.company}`,
        description: "This action cannot be undone.",
        entityLabel: `Experience · ${current.company}`,
        applyTool: "applyDeleteExperience",
        applyArgs: { id: parsed.data.id },
        fields: [
          { name: "Company", before: current.company, after: "(deleted)" },
          { name: "Role", before: current.role, after: "(deleted)" },
          {
            name: "Period",
            before: `${current.start_date} – ${current.end_date ?? "Present"}`,
            after: "(deleted)",
          },
        ],
        redirectUrl: "/admin/experience",
        redirectLabel: "Open experience list",
        proposeTool: "proposeDeleteExperience",
        proposeArgs: { id: parsed.data.id },
      },
    }
  },
}

export const applyDeleteExperienceTool: CopilotApplyTool<
  typeof deleteExpSchema
> = {
  kind: "apply",
  name: "applyDeleteExperience",
  description: "Permanently delete an experience entry.",
  inputSchema: deleteExpSchema,
  async execute(rawArgs) {
    const parsed = deleteExpSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { error } = await supabase
      .from("experience")
      .delete()
      .eq("id", parsed.data.id)
    if (error) return { success: false, error: error.message }
    revalidateExp()
    return {
      success: true,
      data: {
        message: "Experience entry deleted.",
        redirectUrl: "/admin/experience",
        redirectLabel: "Open experience list",
      },
    }
  },
}

export const experienceRegistry = {
  read: { [listExperienceTool.name]: listExperienceTool },
  propose: {
    [proposeCreateExperienceTool.name]: proposeCreateExperienceTool,
    [proposeUpdateExperienceTool.name]: proposeUpdateExperienceTool,
    [proposeDeleteExperienceTool.name]: proposeDeleteExperienceTool,
  },
  apply: {
    [applyCreateExperienceTool.name]: applyCreateExperienceTool,
    [applyUpdateExperienceTool.name]: applyUpdateExperienceTool,
    [applyDeleteExperienceTool.name]: applyDeleteExperienceTool,
  },
}
