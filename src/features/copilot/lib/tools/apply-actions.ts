import "server-only"

import { revalidatePath } from "next/cache"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import { parseFaqItems } from "@/features/knowledge-base/lib/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicLayoutData,
} from "@/features/portfolio/lib/revalidate-cache"

export type ApplyActionName =
  | "applyFaq"
  | "applySummary"
  | "applyTakeaways"
  | "applyTradeoffs"
  | "applyTechnologies"
  | "applyExpertise"
  | "applyConcepts"
  | "applyRelationships"

export type ApplyActionInput = {
  slug: string
  content: unknown
}

export type ApplyActionResult = {
  success: boolean
  error?: string
  data?: unknown
}

async function logCopilotAction(
  action: ApplyActionName,
  entitySlug: string,
  status: "approved" | "rejected" | "pending",
  payload: unknown
) {
  try {
    const supabase = await getAdminMutationClient()
    await supabase.from("copilot_actions" as "projects").insert({
      action,
      entity_slug: entitySlug,
      status,
      payload,
    } as never)
  } catch {
    // best-effort audit trail
  }
}

export async function applyProjectField(
  action: ApplyActionName,
  input: ApplyActionInput,
  confirmed: boolean
): Promise<ApplyActionResult> {
  if (!confirmed) {
    await logCopilotAction(action, input.slug, "pending", input.content)
    return {
      success: true,
      data: {
        message: "Preview ready. Reply 'yes' or confirm to apply changes.",
        preview: input.content,
      },
    }
  }

  const supabase = await getAdminMutationClient()
  const updates: Record<string, unknown> = {}

  switch (action) {
    case "applyFaq":
      updates.faq = parseFaqItems(input.content)
      break
    case "applySummary":
      updates.ai_summary = String(input.content)
      break
    case "applyTakeaways":
      updates.key_takeaways = Array.isArray(input.content) ? input.content : []
      break
    case "applyTradeoffs":
      updates.tradeoffs = input.content
      break
    case "applyTechnologies":
      updates.technologies = Array.isArray(input.content) ? input.content : []
      break
    case "applyExpertise":
      updates.expertise_slugs = Array.isArray(input.content)
        ? input.content
        : []
      break
    case "applyConcepts":
      updates.concepts = Array.isArray(input.content) ? input.content : []
      break
    case "applyRelationships": {
      const rel = input.content as {
        technologies?: string[]
        expertise_slugs?: string[]
        concepts?: string[]
      }
      if (rel.technologies) updates.technologies = rel.technologies
      if (rel.expertise_slugs) updates.expertise_slugs = rel.expertise_slugs
      if (rel.concepts) updates.concepts = rel.concepts
      break
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("slug", input.slug)
    .select("id, slug, title")
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data)
    return { success: false, error: `Project not found: ${input.slug}` }

  await logCopilotAction(action, input.slug, "approved", input.content)
  revalidateKnowledgeAndDiscovery()

  return { success: true, data }
}

export type ApplyAboutInput = {
  field: string
  newContent: string
  currentContent?: string
}

export async function applyAboutSection(
  input: ApplyAboutInput,
  confirmed: boolean
): Promise<ApplyActionResult> {
  if (!confirmed) {
    return {
      success: true,
      data: {
        message:
          "Preview ready — confirm to apply changes to the About section.",
        preview: {
          field: input.field,
          before: input.currentContent ?? "",
          after: input.newContent,
        },
      },
    }
  }

  const supabase = await getAdminMutationClient()

  const { data: existing } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "about_content")
    .maybeSingle()

  const currentValue =
    existing?.value && typeof existing.value === "object"
      ? (existing.value as Record<string, unknown>)
      : {}

  const nextValue = { ...currentValue, [input.field]: input.newContent }

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "about_content", value: nextValue }, { onConflict: "key" })

  if (error) return { success: false, error: error.message }

  // Read-after-write verification — only claim success if DB actually has the new value.
  const { data: verify, error: verifyError } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "about_content")
    .maybeSingle()

  if (verifyError) {
    return {
      success: false,
      error: `Save reported OK but verification read failed: ${verifyError.message}`,
    }
  }

  const persisted =
    verify?.value && typeof verify.value === "object"
      ? (verify.value as Record<string, unknown>)
      : null
  const persistedText =
    persisted && typeof persisted[input.field] === "string"
      ? (persisted[input.field] as string)
      : null

  if (persistedText !== input.newContent) {
    return {
      success: false,
      error:
        "The save didn't persist to the database (live value still differs). Nothing was applied to the About page. Please try again.",
    }
  }

  revalidatePublicLayoutData()
  try {
    revalidatePath("/about")
    revalidatePath("/about", "layout")
    revalidatePath("/")
    revalidatePath("/", "layout")
  } catch {
    // revalidatePath requires a server action / route handler context — best-effort.
  }

  const fieldLabel = (() => {
    switch (input.field) {
      case "intro":
        return "intro paragraph"
      case "intro_tools":
        return "tools/stack line"
      case "career_intro":
        return "career intro paragraph"
      case "after_umbrella":
        return "post-Umbrella paragraph"
      case "retrieval":
        return "retrieval paragraph"
      case "ownership":
        return "ownership paragraph"
      case "outside":
        return "outside-work paragraph"
      case "mcp":
        return "MCP paragraph"
      default:
        return input.field
    }
  })()

  return {
    success: true,
    data: {
      field: input.field,
      applied: persistedText,
      message: `Done — your ${fieldLabel} is now saved and live. Here's how it reads now:`,
      finalText: persistedText,
      redirectUrl: "/about",
      redirectLabel: "View it on the About page",
    },
  }
}
