import "server-only"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import { generateWithFailover } from "@/lib/ai/generate"
import { buildDiscoveryIndex } from "@/lib/discovery/indexer"
import { searchDocuments } from "@/lib/discovery/search"
import { getPublicSettings } from "@/lib/public/queries"
import { revalidateKnowledgeAndDiscovery } from "@/lib/public/revalidate-cache"
import { resolveSiteUrl } from "@/lib/seo/canonical"

import { auditPortfolio, auditProject, suggestRelationships } from "../audit"
import { auditProjectAdvanced } from "../audit/dimensions"
import { applyAboutSection, applyProjectField } from "./apply-actions"
import type { CopilotToolExecutionResult, CopilotToolName } from "./types"
import { getToolDefinition } from "./types"

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

function isAboutField(value: unknown): value is AboutField {
  return typeof value === "string" && (ABOUT_FIELDS as readonly string[]).includes(value)
}

const ABOUT_VARIANT_TONES = [
  {
    label: "Warm & friendly",
    flavor:
      "warm, friendly, conversational, slightly personal — but still professional",
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
): Promise<Array<{ label: string; text: string }>> {
  const settled = await Promise.all(
    ABOUT_VARIANT_TONES.map(async (tone): Promise<{ label: string; text: string } | null> => {
      const prompt = `You are rewriting one paragraph of the "About" page on an AI Engineer portfolio.

Hard rules:
- Preserve ALL proper nouns and technical keywords intact for SEO (e.g. RAG, agent workflows, LangChain, LangGraph, FastAPI, MCP, NL-to-SQL, Azure OpenAI, vector DBs).
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
        return cleaned.length > 0 ? { label: tone.label, text: cleaned } : null
      } catch {
        return null
      }
    })
  )

  return settled.filter(
    (v): v is { label: string; text: string } => v !== null
  )
}

async function getSiteUrl(): Promise<string | null> {
  const settings = await getPublicSettings()
  return resolveSiteUrl(settings.site.site_url) ?? null
}

// Tools that build their own preview (with current state, variants, diff, etc.)
// inside their case handler — skip the generic early-return guard for these.
const TOOLS_WITH_CUSTOM_PREVIEW: CopilotToolName[] = [
  "updateAboutSection",
  "applyFaq",
  "applySummary",
  "applyTakeaways",
  "applyTradeoffs",
  "applyTechnologies",
  "applyExpertise",
  "applyConcepts",
  "applyRelationships",
]

export async function executeCopilotTool(
  name: CopilotToolName,
  args: Record<string, unknown>,
  options: { confirmed?: boolean } = {}
): Promise<CopilotToolExecutionResult> {
  const definition = getToolDefinition(name)
  if (!definition) {
    return { success: false, error: `Unknown tool: ${name}` }
  }

  if (
    definition.requiresConfirmation &&
    !options.confirmed &&
    !TOOLS_WITH_CUSTOM_PREVIEW.includes(name)
  ) {
    return {
      success: true,
      requiresConfirmation: true,
      preview: { tool: name, args },
      data: { message: "This action requires confirmation before execution." },
    }
  }

  try {
    switch (name) {
      case "auditPortfolio":
        return { success: true, data: await auditPortfolio() }

      case "auditProject": {
        const slug = String(args.slug ?? "")
        const supabase = await getAdminMutationClient()
        const { data: project } = await supabase
          .from("projects")
          .select(
            "id, slug, title, summary, seo_title, seo_description, overview, problem, why_built, approach, architecture, architecture_nodes, architecture_image, ai_design, ai_design_nodes, faq, key_takeaways, project_facts, tech_stack, technologies, expertise_slugs, concepts, tradeoffs, ai_summary, results, learnings, gallery, demo_images, cover_image"
          )
          .eq("slug", slug)
          .maybeSingle()

        if (!project) return { success: false, error: `Project not found: ${slug}` }
        return {
          success: true,
          data: {
            health: auditProject(project),
            advanced: auditProjectAdvanced(project),
          },
        }
      }

      case "searchKnowledgeGraph": {
        const query = String(args.query ?? "")
        const siteUrl = await getSiteUrl()
        if (!siteUrl) return { success: false, error: "Site URL not configured" }

        const index = await buildDiscoveryIndex(siteUrl)
        const results = searchDocuments(index.documents, query, { limit: 10 })
        return { success: true, data: results }
      }

      case "suggestRelationships": {
        const entityType = args.entityType as "project" | "technology" | "concept" | "skill"
        const entitySlug = String(args.entitySlug ?? "")
        const suggestions = await suggestRelationships(entityType, entitySlug)
        return { success: true, data: suggestions }
      }

      case "createProject": {
        const supabase = await getAdminMutationClient()
        const title = String(args.title ?? "")
        const slug = String(args.slug ?? "")
        const summary = String(args.summary ?? title)

        const { data, error } = await supabase
          .from("projects")
          .insert({
            title,
            slug,
            summary,
            status: "draft",
            tech_stack: [],
            technologies: [],
            concepts: [],
            expertise_slugs: [],
            key_takeaways: [],
            faq: [],
            project_facts: {},
            tradeoffs: [],
            metrics: {},
            challenges: [],
            content: { type: "doc", content: [] },
          })
          .select("id, slug, title")
          .single()

        if (error) return { success: false, error: error.message }
        revalidateKnowledgeAndDiscovery()
        return { success: true, data }
      }

      case "updateProject": {
        const supabase = await getAdminMutationClient()
        const slug = String(args.slug ?? "")
        const updates = (args.updates ?? {}) as Record<string, unknown>

        const { data, error } = await supabase
          .from("projects")
          .update(updates)
          .eq("slug", slug)
          .select("id, slug, title")
          .maybeSingle()

        if (error) return { success: false, error: error.message }
        if (!data) return { success: false, error: `Project not found: ${slug}` }
        revalidateKnowledgeAndDiscovery()
        return { success: true, data }
      }

      case "createSkill": {
        const supabase = await getAdminMutationClient()
        const name = String(args.name ?? "")
        const category = String(args.category ?? "other")

        const { count } = await supabase
          .from("skills")
          .select("id", { count: "exact", head: true })

        const { data, error } = await supabase
          .from("skills")
          .insert({
            name,
            category: category as "language" | "framework" | "tool" | "cloud" | "ai_ml" | "soft" | "other",
            proficiency: "intermediate",
            show_on_landing: false,
            display_order: count ?? 0,
          })
          .select("id, name")
          .single()

        if (error) return { success: false, error: error.message }
        revalidateKnowledgeAndDiscovery()
        return { success: true, data }
      }

      case "updateSkill": {
        const supabase = await getAdminMutationClient()
        const id = String(args.id ?? "")
        const updates = (args.updates ?? {}) as Record<string, unknown>

        const { data, error } = await supabase
          .from("skills")
          .update(updates)
          .eq("id", id)
          .select("id, name")
          .maybeSingle()

        if (error) return { success: false, error: error.message }
        if (!data) return { success: false, error: `Skill not found: ${id}` }
        return { success: true, data }
      }

      case "createTechnology": {
        const supabase = await getAdminMutationClient()
        const title = String(args.title ?? "")
        const slug = String(args.slug ?? "")

        const { data, error } = await supabase
          .from("technology_registry")
          .insert({
            title,
            slug,
            status: "draft",
            featured: false,
            display_order: 0,
          })
          .select("id, slug, title")
          .single()

        if (error) return { success: false, error: error.message }
        revalidateKnowledgeAndDiscovery()
        return { success: true, data }
      }

      case "createConcept": {
        const supabase = await getAdminMutationClient()
        const title = String(args.title ?? "")
        const slug = String(args.slug ?? "")

        const { data, error } = await supabase
          .from("concept_registry")
          .insert({
            title,
            slug,
            status: "draft",
            featured: false,
            display_order: 0,
            related_concept_slugs: [],
            related_expertise_slugs: [],
          })
          .select("id, slug, title")
          .single()

        if (error) return { success: false, error: error.message }
        revalidateKnowledgeAndDiscovery()
        return { success: true, data }
      }

      case "createContent":
      case "updateContent":
        return {
          success: true,
          requiresConfirmation: true,
          preview: { tool: name, args },
          data: {
            message:
              "Content create/update requires form validation. Use the CMS editor or provide full content payload with confirmation.",
          },
        }

      case "generateAiSummary":
      case "generateFaq":
      case "generateKeyTakeaways":
      case "generateTradeoffs":
      case "generateCaseStudy":
        return generateContentPreview(name, args)

      case "applyFaq":
      case "applySummary":
      case "applyTakeaways":
      case "applyTradeoffs":
      case "applyTechnologies":
      case "applyExpertise":
      case "applyConcepts":
      case "applyRelationships":
        return applyProjectField(
          name,
          { slug: String(args.slug ?? ""), content: args.content },
          options.confirmed ?? false
        )

      case "updateAboutSection": {
        const field = isAboutField(args.field) ? args.field : "intro"
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
        const currentText =
          typeof currentValue[field] === "string"
            ? (currentValue[field] as string)
            : ""

        const newContent =
          typeof args.newContent === "string" ? args.newContent.trim() : ""
        const instruction =
          typeof args.instruction === "string" ? args.instruction.trim() : ""
        const variantsArg = Array.isArray(args.variants)
          ? (args.variants as unknown[]).filter(
              (v): v is string => typeof v === "string" && v.trim().length > 0
            )
          : null
        const variantIndex =
          typeof args.variantIndex === "number" && Number.isInteger(args.variantIndex)
            ? args.variantIndex
            : 0

        // Confirm path — apply selected variant or newContent
        if (options.confirmed) {
          let textToApply = ""
          if (variantsArg && variantsArg[variantIndex]) {
            textToApply = variantsArg[variantIndex]
          } else if (newContent) {
            textToApply = newContent
          }
          if (!textToApply) {
            return { success: false, error: "No content selected to apply." }
          }
          return applyAboutSection(
            { field, newContent: textToApply, currentContent: currentText },
            true
          )
        }

        // Preview path — build variants
        let variants: Array<{ label: string; text: string }> = []

        if (newContent && !instruction) {
          variants = [{ label: "Custom edit", text: newContent }]
        } else if (instruction) {
          variants = await generateAboutVariants(instruction, currentText)
          if (variants.length === 0) {
            return {
              success: false,
              error:
                "Could not generate rewrites. Check that an AI provider key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) is configured.",
            }
          }
        } else {
          return {
            success: false,
            error: "Provide either newContent or instruction.",
          }
        }

        return {
          success: true,
          requiresConfirmation: true,
          preview: {
            kind: "about_edit",
            field,
            before: currentText,
            variants,
            instruction: instruction || undefined,
          },
          data: {
            message: `Generated ${variants.length} rewrite${variants.length === 1 ? "" : "s"} for About → ${field}. Pick one and confirm.`,
          },
        }
      }

      default:
        return { success: false, error: `Tool not implemented: ${name}` }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    }
  }
}

async function generateContentPreview(
  tool: CopilotToolName,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult> {
  const slug = String(args.slug ?? "")
  const entityType = String(args.entityType ?? "project")
  const supabase = await getAdminMutationClient()

  let entityData: Record<string, unknown> | null = null

  if (entityType === "project") {
    const { data } = await supabase
      .from("projects")
      .select("title, summary, overview, problem, why_built, tech_stack, ai_summary")
      .eq("slug", slug)
      .maybeSingle()
    entityData = data
  } else {
    const { data } = await supabase
      .from("content")
      .select("title, excerpt, ai_summary, type")
      .eq("slug", slug)
      .maybeSingle()
    entityData = data
  }

  if (!entityData) {
    return { success: false, error: `Entity not found: ${slug}` }
  }

  const promptMap: Record<string, string> = {
    generateAiSummary: `Generate a concise AI summary (2-3 sentences) for this portfolio ${entityType}. Return only the summary text.`,
    generateFaq: `Generate 3-5 FAQ items as JSON array [{question, answer}] for this project. Return only valid JSON.`,
    generateKeyTakeaways: `Generate 3-5 key takeaways as JSON string array. Return only valid JSON.`,
    generateTradeoffs: `Generate 2-3 architecture tradeoffs as JSON array [{decision, alternative, reason}]. Return only valid JSON.`,
    generateCaseStudy: `Generate a case study overview (problem, approach, outcome) in markdown. Return only the markdown.`,
  }

  const text = await generateWithFailover(
    `${promptMap[tool]}\n\nEntity data:\n${JSON.stringify(entityData, null, 2)}`
  )

  return {
    success: true,
    preview: { tool, slug, generated: text },
    data: { message: "Generated preview — confirm before saving to CMS." },
  }
}

export async function buildCopilotToolDescriptions(): Promise<string> {
  const { COPILOT_TOOLS } = await import("./types")
  return COPILOT_TOOLS.map(
    (tool) =>
      `- ${tool.name}: ${tool.description}${tool.requiresConfirmation ? " (requires confirmation)" : ""}`
  ).join("\n")
}

export type { CopilotToolDefinition, CopilotToolExecutionResult, CopilotToolName } from "./types"
export { COPILOT_TOOLS, getToolDefinition } from "./types"
