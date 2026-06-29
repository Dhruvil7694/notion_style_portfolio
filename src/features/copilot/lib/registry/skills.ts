import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import { skillFormSchema } from "@/features/admin/lib/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicSkills,
} from "@/features/portfolio/lib/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

function revalidateSkills() {
  try {
    revalidatePath("/")
    revalidatePath("/stack")
    revalidatePath("/admin/skills")
  } catch {
    // best-effort
  }
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
}

// ---------- read ----------

const listSkillsSchema = z.object({
  category: z
    .enum(["language", "framework", "tool", "cloud", "ai_ml", "soft", "other"])
    .optional()
    .describe("Filter by category."),
  search: z.string().optional().describe("Substring match against skill name."),
})

type SkillRow = {
  id: string
  name: string
  category: string
  proficiency: string | null
  show_on_landing: boolean
  display_order: number
}

export const listSkillsTool: CopilotReadTool<
  typeof listSkillsSchema,
  SkillRow[]
> = {
  kind: "read",
  name: "listSkills",
  description:
    "List all skills in the taxonomy. Use before proposing skill edits so you can reference existing IDs and avoid duplicates.",
  inputSchema: listSkillsSchema,
  async execute(rawArgs) {
    const args = listSkillsSchema.parse(rawArgs)
    const supabase = await getAdminMutationClient()
    let query = supabase
      .from("skills")
      .select("id, name, category, proficiency, show_on_landing, display_order")
      .order("display_order", { ascending: true })

    if (args.category) query = query.eq("category", args.category)
    if (args.search) query = query.ilike("name", `%${args.search}%`)

    const { data, error } = await query
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as SkillRow[] }
  },
}

// ---------- propose: create ----------

const proposeCreateSkillSchema = skillFormSchema.extend({
  proficiency: z
    .enum(["learning", "proficient", "expert"])
    .nullable()
    .optional()
    .describe("Skill proficiency level or null."),
})

export const proposeCreateSkillTool: CopilotProposeTool<
  typeof proposeCreateSkillSchema
> = {
  kind: "propose",
  name: "proposeCreateSkill",
  description:
    "Propose creating a new skill entry. Always confirm with the admin before writing. Required: name, category. Optional: proficiency, show_on_landing.",
  inputSchema: proposeCreateSkillSchema,
  async build(rawArgs) {
    const parsed = proposeCreateSkillSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid skill: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      }
    }
    const data = parsed.data
    return {
      ok: true,
      pending: {
        label: `Create skill "${data.name}"`,
        description: `New ${data.category} skill in the taxonomy.`,
        entityLabel: `Skill · ${data.name}`,
        applyTool: "applyCreateSkill",
        applyArgs: { ...data },
        fields: [
          { name: "Name", before: "—", after: data.name },
          { name: "Category", before: "—", after: data.category },
          { name: "Proficiency", before: "—", after: data.proficiency ?? "—" },
          { name: "Show on landing", before: "—", after: data.show_on_landing },
        ],
        redirectUrl: "/admin/skills",
        redirectLabel: "Open skills list",
        proposeTool: "proposeCreateSkill",
        proposeArgs: { ...data },
      },
    }
  },
}

const applyCreateSkillSchema = proposeCreateSkillSchema

export const applyCreateSkillTool: CopilotApplyTool<
  typeof applyCreateSkillSchema
> = {
  kind: "apply",
  name: "applyCreateSkill",
  description: "Insert a new skill row.",
  inputSchema: applyCreateSkillSchema,
  async execute(rawArgs) {
    const parsed = applyCreateSkillSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const data = parsed.data
    const supabase = await getAdminMutationClient()

    const { count } = await supabase
      .from("skills")
      .select("id", { count: "exact", head: true })

    const { data: row, error } = await supabase
      .from("skills")
      .insert({
        name: data.name,
        category: data.category,
        proficiency: data.proficiency ?? null,
        show_on_landing: data.show_on_landing,
        display_order: count ?? 0,
      })
      .select("id, name")
      .single()

    if (error) return { success: false, error: error.message }
    revalidateSkills()
    return {
      success: true,
      data: {
        message: `Created skill "${row.name}".`,
        redirectUrl: "/admin/skills",
        redirectLabel: "Open skills list",
        id: row.id,
      },
    }
  },
}

// ---------- propose: update ----------

const proposeUpdateSkillSchema = z.object({
  id: z.string().uuid().describe("Skill ID — use listSkills to find it."),
  name: z.string().min(1).optional(),
  category: z
    .enum(["language", "framework", "tool", "cloud", "ai_ml", "soft", "other"])
    .optional(),
  proficiency: z
    .enum(["learning", "proficient", "expert"])
    .nullable()
    .optional(),
  show_on_landing: z.boolean().optional(),
})

export const proposeUpdateSkillTool: CopilotProposeTool<
  typeof proposeUpdateSkillSchema
> = {
  kind: "propose",
  name: "proposeUpdateSkill",
  description:
    "Propose changes to an existing skill by ID. Only fields you want to change need to be provided.",
  inputSchema: proposeUpdateSkillSchema,
  async build(rawArgs) {
    const parsed = proposeUpdateSkillSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { id, ...changes } = parsed.data
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("skills")
      .select("id, name, category, proficiency, show_on_landing")
      .eq("id", id)
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    if (!current) return { ok: false, error: `Skill ${id} not found.` }

    const fields = Object.entries(changes)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({
        name: key,
        key,
        before: (current as Record<string, unknown>)[key],
        after: value,
      }))

    if (fields.length === 0) {
      return { ok: false, error: "No fields to update." }
    }

    return {
      ok: true,
      pending: {
        label: `Update skill "${current.name}"`,
        description: `Change ${fields.length} field${fields.length === 1 ? "" : "s"}.`,
        entityLabel: `Skill · ${current.name}`,
        applyTool: "applyUpdateSkill",
        applyArgs: { id, ...changes },
        fields,
        redirectUrl: `/admin/skills/${id}`,
        redirectLabel: "Open skill editor",
        proposeTool: "proposeUpdateSkill",
        proposeArgs: { id, ...changes },
      },
    }
  },
}

const applyUpdateSkillSchema = proposeUpdateSkillSchema

export const applyUpdateSkillTool: CopilotApplyTool<
  typeof applyUpdateSkillSchema
> = {
  kind: "apply",
  name: "applyUpdateSkill",
  description: "Update a skill row.",
  inputSchema: applyUpdateSkillSchema,
  async execute(rawArgs) {
    const parsed = applyUpdateSkillSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { id, ...changes } = parsed.data
    const supabase = await getAdminMutationClient()

    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) updates[k] = v
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No fields to update." }
    }

    const { data, error } = await supabase
      .from("skills")
      .update(updates)
      .eq("id", id)
      .select("id, name")
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: `Skill ${id} not found.` }

    revalidateSkills()
    return {
      success: true,
      data: {
        message: `Updated skill "${data.name}".`,
        redirectUrl: `/admin/skills/${id}`,
        redirectLabel: "Open skill editor",
      },
    }
  },
}

// ---------- delete ----------

const deleteSkillSchema = z.object({
  id: z.string().uuid().describe("Skill ID — use listSkills to find it."),
})

export const proposeDeleteSkillTool: CopilotProposeTool<
  typeof deleteSkillSchema
> = {
  kind: "propose",
  name: "proposeDeleteSkill",
  description:
    "Propose permanently deleting a skill entry. ALWAYS call listSkills first to confirm the correct ID.",
  inputSchema: deleteSkillSchema,
  async build(rawArgs) {
    const parsed = deleteSkillSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const supabase = await getAdminMutationClient()
    const { data: current, error } = await supabase
      .from("skills")
      .select("name, category, proficiency")
      .eq("id", parsed.data.id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!current)
      return { ok: false, error: `Skill ${parsed.data.id} not found.` }
    return {
      ok: true,
      pending: {
        label: `Delete skill "${current.name}"`,
        description: "This action cannot be undone.",
        entityLabel: `Skill · ${current.name}`,
        applyTool: "applyDeleteSkill",
        applyArgs: { id: parsed.data.id },
        fields: [
          { name: "Name", before: current.name, after: "(deleted)" },
          { name: "Category", before: current.category, after: "(deleted)" },
        ],
        redirectUrl: "/admin/skills",
        redirectLabel: "Open skills list",
        proposeTool: "proposeDeleteSkill",
        proposeArgs: { id: parsed.data.id },
      },
    }
  },
}

export const applyDeleteSkillTool: CopilotApplyTool<typeof deleteSkillSchema> =
  {
    kind: "apply",
    name: "applyDeleteSkill",
    description: "Permanently delete a skill entry.",
    inputSchema: deleteSkillSchema,
    async execute(rawArgs) {
      const parsed = deleteSkillSchema.safeParse(rawArgs)
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join("; "),
        }
      }
      const supabase = await getAdminMutationClient()
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", parsed.data.id)
      if (error) return { success: false, error: error.message }
      revalidateSkills()
      return {
        success: true,
        data: {
          message: "Skill deleted.",
          redirectUrl: "/admin/skills",
          redirectLabel: "Open skills list",
        },
      }
    },
  }

export const skillsRegistry = {
  read: { [listSkillsTool.name]: listSkillsTool },
  propose: {
    [proposeCreateSkillTool.name]: proposeCreateSkillTool,
    [proposeUpdateSkillTool.name]: proposeUpdateSkillTool,
    [proposeDeleteSkillTool.name]: proposeDeleteSkillTool,
  },
  apply: {
    [applyCreateSkillTool.name]: applyCreateSkillTool,
    [applyUpdateSkillTool.name]: applyUpdateSkillTool,
    [applyDeleteSkillTool.name]: applyDeleteSkillTool,
  },
}
