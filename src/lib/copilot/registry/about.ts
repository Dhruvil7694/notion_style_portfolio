import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import { generateWithFailover } from "@/lib/ai/generate"
import { revalidatePublicLayoutData } from "@/lib/public/revalidate-cache"

import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
} from "./types"

const ABOUT_FIELDS = [
  "intro",
  "intro_tools",
  "career_intro",
  "after_umbrella",
  "retrieval",
  "ownership",
  "outside",
  "mcp",
] as const

type AboutField = (typeof ABOUT_FIELDS)[number]

const ABOUT_FIELD_LABEL: Record<AboutField, string> = {
  intro: "intro paragraph",
  intro_tools: "tools/stack line",
  career_intro: "career intro paragraph",
  after_umbrella: "post-Umbrella paragraph",
  retrieval: "retrieval paragraph",
  ownership: "ownership paragraph",
  outside: "outside-work paragraph",
  mcp: "MCP paragraph",
}

const aboutFieldSchema = z.enum(ABOUT_FIELDS)

async function loadAboutContent(): Promise<Record<string, unknown>> {
  const supabase = await getAdminMutationClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "about_content")
    .maybeSingle()
  return data?.value && typeof data.value === "object"
    ? (data.value as Record<string, unknown>)
    : {}
}

const VARIANT_TONES = [
  {
    label: "Warm & friendly",
    flavor:
      "warm, friendly, conversational, slightly personal — still professional",
  },
  {
    label: "Concise & direct",
    flavor: "concise, direct, plain English, short sentences, no fluff",
  },
  {
    label: "Confident & punchy",
    flavor:
      "confident, punchy, slightly bold; one strong sentence preferred over multiple weaker ones",
  },
] as const

async function generateAboutVariants(
  instruction: string,
  currentText: string
): Promise<Array<{ label: string; value: string }>> {
  const results = await Promise.all(
    VARIANT_TONES.map(async (tone) => {
      const prompt = `You are rewriting one paragraph of the "About" page on an AI Engineer portfolio.

Hard rules:
- Preserve ALL proper nouns and technical keywords (RAG, agent workflows, LangChain, LangGraph, FastAPI, MCP, NL-to-SQL, Azure OpenAI, vector DBs).
- Preserve factual claims. Do not invent companies, dates, or technologies.
- Output a single paragraph only.
- Tone: ${tone.flavor}.

User instruction:
${instruction}

Current text:
${currentText || "(empty)"}

Return ONLY the rewritten paragraph. No quotes, preamble, label, or explanation.`
      try {
        const text = await generateWithFailover(prompt)
        const cleaned = text.trim().replace(/^["']|["']$/g, "")
        return cleaned.length > 0 ? { label: tone.label, value: cleaned } : null
      } catch {
        return null
      }
    })
  )
  return results.filter((v) => v !== null) as Array<{
    label: string
    value: string
  }>
}

// ---------- read ----------

export const getAboutContentTool: CopilotReadTool = {
  kind: "read",
  name: "getAboutContent",
  description:
    "Read the current About-page content (all paragraphs and tags). Call this before proposing About edits so previews are grounded in real values.",
  inputSchema: z.object({}),
  async execute() {
    const value = await loadAboutContent()
    return { ok: true, data: value }
  },
}

// ---------- propose ----------

const proposeAboutEditSchema = z.object({
  field: aboutFieldSchema.describe(
    "Which About paragraph to edit. Default to 'intro' if user is vague."
  ),
  instruction: z
    .string()
    .min(4)
    .describe(
      "Plain-English direction for the rewrite, e.g. 'make it warmer and shorter'. Required unless newContent is provided."
    )
    .optional(),
  newContent: z
    .string()
    .min(4)
    .describe(
      "Exact replacement text. Use when the user has provided the new paragraph verbatim."
    )
    .optional(),
})

export const proposeAboutEditTool: CopilotProposeTool<
  typeof proposeAboutEditSchema
> = {
  kind: "propose",
  name: "proposeAboutEdit",
  description:
    "Propose an edit to one About-page paragraph. If 'instruction' is given, generates 3 tone variants for the admin to pick from. If 'newContent' is given, proposes that exact text. Never writes — admin confirms in the UI.",
  inputSchema: proposeAboutEditSchema,
  async build(args) {
    const parsed = proposeAboutEditSchema.parse(args)
    const field = parsed.field
    const currentValue = await loadAboutContent()
    const currentText =
      typeof currentValue[field] === "string"
        ? (currentValue[field] as string)
        : ""

    let variants: Array<{ label: string; value: string }> = []

    if (parsed.newContent) {
      variants = [{ label: "Provided text", value: parsed.newContent.trim() }]
    } else if (parsed.instruction) {
      variants = await generateAboutVariants(parsed.instruction, currentText)
      if (variants.length === 0) {
        return {
          ok: false,
          error:
            "Could not generate rewrites. Check that an AI provider key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) is configured.",
        }
      }
    } else {
      return {
        ok: false,
        error:
          "proposeAboutEdit requires either 'instruction' or 'newContent'.",
      }
    }

    const fieldLabel = ABOUT_FIELD_LABEL[field]

    return {
      ok: true,
      pending: {
        label: `Apply ${fieldLabel} rewrite`,
        description:
          variants.length > 1
            ? "Pick a tone, then confirm to save."
            : "Confirm to save the proposed text.",
        entityLabel: `About · ${fieldLabel}`,
        applyTool: "applyAboutEdit",
        applyArgs: { field, newContent: variants[0]!.value },
        variantArgKey: "newContent",
        fields: [
          {
            name: fieldLabel,
            key: field,
            before: currentText,
            after: variants[0]!.value,
          },
        ],
        variants,
        redirectUrl: "/about",
        redirectLabel: "View it on the About page",
        proposeTool: "proposeAboutEdit",
        proposeArgs: {
          field: parsed.field,
          ...(parsed.instruction ? { instruction: parsed.instruction } : {}),
          ...(parsed.newContent ? { newContent: parsed.newContent } : {}),
        },
      },
    }
  },
}

// ---------- apply ----------

const applyAboutEditSchema = z.object({
  field: aboutFieldSchema,
  newContent: z.string().min(1),
})

export const applyAboutEditTool: CopilotApplyTool<
  typeof applyAboutEditSchema
> = {
  kind: "apply",
  name: "applyAboutEdit",
  description: "Write the new paragraph to settings.about_content.<field>.",
  inputSchema: applyAboutEditSchema,
  async execute(rawArgs) {
    const parsed = applyAboutEditSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid arguments: ${parsed.error.issues
          .map((i) => i.message)
          .join("; ")}`,
      }
    }
    const { field, newContent } = parsed.data
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

    const { error: writeError } = await supabase
      .from("settings")
      .upsert(
        { key: "about_content", value: { ...currentValue, [field]: newContent } },
        { onConflict: "key" }
      )

    if (writeError) return { success: false, error: writeError.message }

    // Read-after-write verification — only declare success if the DB now matches.
    const { data: verify } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "about_content")
      .maybeSingle()

    const persisted =
      verify?.value && typeof verify.value === "object"
        ? (verify.value as Record<string, unknown>)
        : null
    const persistedText =
      persisted && typeof persisted[field] === "string"
        ? (persisted[field] as string)
        : null

    if (persistedText !== newContent) {
      return {
        success: false,
        error:
          "Save reported OK but the database still shows the old value. Nothing applied. Please retry.",
      }
    }

    revalidatePublicLayoutData()
    try {
      revalidatePath("/about")
      revalidatePath("/about", "layout")
      revalidatePath("/")
      revalidatePath("/", "layout")
    } catch {
      // best-effort
    }

    return {
      success: true,
      data: {
        message: `Done — your ${ABOUT_FIELD_LABEL[field]} is now saved and live. Here's how it reads now:`,
        finalText: persistedText,
        redirectUrl: "/about",
        redirectLabel: "View it on the About page",
        field,
      },
    }
  },
}

export const aboutRegistry = {
  read: { [getAboutContentTool.name]: getAboutContentTool },
  propose: { [proposeAboutEditTool.name]: proposeAboutEditTool },
  apply: { [applyAboutEditTool.name]: applyAboutEditTool },
}
