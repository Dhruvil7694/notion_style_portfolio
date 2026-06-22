import "server-only"

import { z } from "zod"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import { revalidatePublicLayoutData } from "@/lib/public/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

// ---------- helpers ----------

async function readSettings(key: string): Promise<Record<string, unknown>> {
  const supabase = await getAdminMutationClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle()
  return data?.value && typeof data.value === "object"
    ? (data.value as Record<string, unknown>)
    : {}
}

async function writeSettings(
  key: string,
  patch: Record<string, unknown>
): Promise<{ error?: string }> {
  const current = await readSettings(key)
  const supabase = await getAdminMutationClient()
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: { ...current, ...patch } }, { onConflict: "key" })
  return { error: error?.message }
}

// ---------- site profile read ----------

export const getSiteProfileTool: CopilotReadTool<
  z.ZodObject<Record<string, never>>,
  Record<string, unknown>
> = {
  kind: "read",
  name: "getSiteProfile",
  description:
    "Read the current site profile (owner name, title, status bubble, focus areas, etc.).",
  inputSchema: z.object({}),
  async execute() {
    const value = await readSettings("site_settings")
    return { ok: true, data: value }
  },
}

// ---------- site profile update ----------

const PROFILE_TEXT_FIELDS = [
  "owner_name",
  "owner_title",
  "site_name",
  "site_description",
  "status_bubble",
  "currently_building",
  "currently_reading",
  "next_project",
  "current_project",
  "custom_status",
  "experience_summary",
] as const

const PROFILE_ARRAY_FIELDS = [
  "status_messages",
  "focus_areas",
  "selected_metrics",
] as const

const proposeProfileFieldSchema = z.object({
  field: z
    .string()
    .describe(
      `Profile field to update. Text fields: ${PROFILE_TEXT_FIELDS.join(", ")}. Array fields: ${PROFILE_ARRAY_FIELDS.join(", ")}.`
    ),
  value: z
    .union([z.string(), z.array(z.string())])
    .describe("New value. String for text fields, string[] for array fields."),
})

export const proposeProfileFieldTool: CopilotProposeTool<
  typeof proposeProfileFieldSchema
> = {
  kind: "propose",
  name: "proposeProfileFieldUpdate",
  description:
    "Propose updating a single site profile field (owner name, title, status bubble, focus areas, etc.).",
  inputSchema: proposeProfileFieldSchema,
  async build(rawArgs) {
    const parsed = proposeProfileFieldSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { field, value } = parsed.data
    const isText = (PROFILE_TEXT_FIELDS as readonly string[]).includes(field)
    const isArray = (PROFILE_ARRAY_FIELDS as readonly string[]).includes(field)

    if (!isText && !isArray) {
      return { ok: false, error: `Unsupported profile field: ${field}` }
    }
    if (isText && typeof value !== "string") {
      return { ok: false, error: `Field "${field}" expects a string value.` }
    }
    if (isArray && !Array.isArray(value)) {
      return { ok: false, error: `Field "${field}" expects an array of strings.` }
    }

    const current = await readSettings("site_settings")
    const currentValue = current[field] ?? null

    return {
      ok: true,
      pending: {
        label: `Update profile: ${field}`,
        entityLabel: "Site Profile",
        applyTool: "applyProfileFieldUpdate",
        applyArgs: { field, value },
        fields: [{ name: field, key: field, before: currentValue, after: value }],
        proposeTool: "proposeProfileFieldUpdate",
        proposeArgs: { field, value },
      },
    }
  },
}

export const applyProfileFieldTool: CopilotApplyTool<
  typeof proposeProfileFieldSchema
> = {
  kind: "apply",
  name: "applyProfileFieldUpdate",
  description: "Write a single site profile field.",
  inputSchema: proposeProfileFieldSchema,
  async execute(rawArgs) {
    const parsed = proposeProfileFieldSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { field, value } = parsed.data
    const { error } = await writeSettings("site_settings", { [field]: value })
    if (error) return { success: false, error }
    revalidatePublicLayoutData()
    return {
      success: true,
      data: {
        message: `Updated ${field} on your site profile.`,
        finalText:
          typeof value === "string" ? value : (value as string[]).join(", "),
      },
    }
  },
}

// ---------- social links ----------

const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "twitter",
  "instagram",
  "substack",
  "medium",
  "discord",
  "youtube",
  "bluesky",
  "threads",
  "devto",
] as const

export const getSocialLinksTool: CopilotReadTool<
  z.ZodObject<Record<string, never>>,
  Record<string, unknown>
> = {
  kind: "read",
  name: "getSocialLinks",
  description:
    "Read the current social media links (GitHub, LinkedIn, Twitter, etc.).",
  inputSchema: z.object({}),
  async execute() {
    const value = await readSettings("social_links")
    return { ok: true, data: value }
  },
}

const proposeSocialLinkSchema = z.object({
  platform: z
    .enum(SOCIAL_PLATFORMS)
    .describe(`Social platform: ${SOCIAL_PLATFORMS.join(", ")}.`),
  url: z
    .string()
    .nullable()
    .describe("Full URL or null to remove the link."),
})

export const proposeSocialLinkTool: CopilotProposeTool<
  typeof proposeSocialLinkSchema
> = {
  kind: "propose",
  name: "proposeSocialLinkUpdate",
  description: "Propose updating or removing a social media link.",
  inputSchema: proposeSocialLinkSchema,
  async build(rawArgs) {
    const parsed = proposeSocialLinkSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { platform, url } = parsed.data
    const current = await readSettings("social_links")
    return {
      ok: true,
      pending: {
        label: `Update ${platform} link`,
        entityLabel: "Social Links",
        applyTool: "applySocialLinkUpdate",
        applyArgs: { platform, url },
        fields: [{ name: platform, before: current[platform] ?? null, after: url }],
        proposeTool: "proposeSocialLinkUpdate",
        proposeArgs: { platform, url },
      },
    }
  },
}

export const applySocialLinkTool: CopilotApplyTool<typeof proposeSocialLinkSchema> = {
  kind: "apply",
  name: "applySocialLinkUpdate",
  description: "Save a social link change.",
  inputSchema: proposeSocialLinkSchema,
  async execute(rawArgs) {
    const parsed = proposeSocialLinkSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { platform, url } = parsed.data
    const { error } = await writeSettings("social_links", { [platform]: url })
    if (error) return { success: false, error }
    revalidatePublicLayoutData()
    return {
      success: true,
      data: {
        message: url
          ? `Updated ${platform} link.`
          : `Removed ${platform} link.`,
        finalText: url ?? "(removed)",
      },
    }
  },
}

// ---------- contact info ----------

const CONTACT_FIELDS = ["email", "location", "calendly_url"] as const

export const getContactInfoTool: CopilotReadTool<
  z.ZodObject<Record<string, never>>,
  Record<string, unknown>
> = {
  kind: "read",
  name: "getContactInfo",
  description: "Read the current contact info (email, location, Calendly URL).",
  inputSchema: z.object({}),
  async execute() {
    const value = await readSettings("contact_info")
    return { ok: true, data: value }
  },
}

const proposeContactInfoSchema = z.object({
  field: z
    .enum(CONTACT_FIELDS)
    .describe(`Contact field: ${CONTACT_FIELDS.join(", ")}.`),
  value: z.string().nullable().describe("New value or null to clear."),
})

export const proposeContactInfoTool: CopilotProposeTool<
  typeof proposeContactInfoSchema
> = {
  kind: "propose",
  name: "proposeContactInfoUpdate",
  description: "Propose updating a contact info field (email, location, calendly_url).",
  inputSchema: proposeContactInfoSchema,
  async build(rawArgs) {
    const parsed = proposeContactInfoSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { field, value } = parsed.data
    const current = await readSettings("contact_info")
    return {
      ok: true,
      pending: {
        label: `Update contact: ${field}`,
        entityLabel: "Contact Info",
        applyTool: "applyContactInfoUpdate",
        applyArgs: { field, value },
        fields: [{ name: field, before: current[field] ?? null, after: value }],
        proposeTool: "proposeContactInfoUpdate",
        proposeArgs: { field, value },
      },
    }
  },
}

export const applyContactInfoTool: CopilotApplyTool<typeof proposeContactInfoSchema> = {
  kind: "apply",
  name: "applyContactInfoUpdate",
  description: "Save a contact info field change.",
  inputSchema: proposeContactInfoSchema,
  async execute(rawArgs) {
    const parsed = proposeContactInfoSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      }
    }
    const { field, value } = parsed.data
    const { error } = await writeSettings("contact_info", { [field]: value })
    if (error) return { success: false, error }
    revalidatePublicLayoutData()
    return {
      success: true,
      data: {
        message: `Updated ${field}.`,
        finalText: value ?? "(cleared)",
      },
    }
  },
}

export const profileRegistry = {
  read: {
    [getSiteProfileTool.name]: getSiteProfileTool,
    [getSocialLinksTool.name]: getSocialLinksTool,
    [getContactInfoTool.name]: getContactInfoTool,
  },
  propose: {
    [proposeProfileFieldTool.name]: proposeProfileFieldTool,
    [proposeSocialLinkTool.name]: proposeSocialLinkTool,
    [proposeContactInfoTool.name]: proposeContactInfoTool,
  },
  apply: {
    [applyProfileFieldTool.name]: applyProfileFieldTool,
    [applySocialLinkTool.name]: applySocialLinkTool,
    [applyContactInfoTool.name]: applyContactInfoTool,
  },
}
