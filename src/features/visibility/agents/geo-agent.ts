import "server-only"

import { generateWithFailover } from "@/features/ai/lib/generate"

import type { GeoFix, VisibilityFixResult } from "./types"

const SYSTEM_BASE = `You are a GEO (Generative Engine Optimization) specialist agent for an AI Engineer portfolio. Improve content so LLMs include it in generated answers about AI engineers, ML engineers, and applied AI projects.

Field specs:
- ai_summary: entity definition paragraph LLMs use to establish factual authority. Factual, structured, include entity names, metrics, technical specifics. 200-300 words. Third person.
- key_takeaways: LLM-extractable fact bullets. 4-7 bullets. Include numbers, percentages, specific technologies. Format: "[What] [How/metric] [tech if relevant]"
- concepts: semantic slugs anchoring content to knowledge graph nodes. Lowercase-hyphenated. 4-10 slugs.
- faq: at least 3 Q&A pairs for FAQPage schema. Questions end with "?", answers 40-100 words.
- summary: 120-200 char plain-text excerpt. Third person, factual, entity-definition style.
- tags: 3-8 plain-text topic tags relevant to this content (e.g. "LangGraph", "RAG", "AI Agent").
- expertise_slugs: pick MOST RELEVANT slugs from the available list ONLY. 1-3 max. Empty array if none fit.

Rules:
- Write as entity definitions, not marketing copy
- Include proper nouns (technology names, model names, method names)
- Metrics and numbers increase LLM citation probability
- Do not invent facts not in source content
- Return ONLY valid JSON, no markdown fences`

function buildSchema(neededFields?: Set<string>): string {
  const all = !neededFields
  return `Output schema (only include fields listed here):
{
  ${all || neededFields.has("ai_summary") ? `"ai_summary": "string 200-300 words",` : ""}
  ${all || neededFields.has("key_takeaways") ? `"key_takeaways": ["string", "..."],` : ""}
  ${all || neededFields.has("concepts") ? `"concepts": ["slug", "..."],` : ""}
  ${all || neededFields.has("faq") ? `"faq": [{"question": "string ends with ?", "answer": "string"}, "..."],` : ""}
  ${all || neededFields.has("summary") ? `"summary": "string 120-200 chars",` : ""}
  ${all || neededFields.has("tags") ? `"tags": ["string", "..."],` : ""}
  ${all || neededFields.has("expertise_slugs") ? `"expertise_slugs": ["slug-from-available-list", "..."],` : ""}
  "reasoning": "1-2 sentences on what LLM signals you strengthened"
}`
}

export async function runGeoAgent(
  item: Record<string, unknown>,
  availableExpertiseSlugs: string[] = [],
  neededFields?: Set<string>
): Promise<VisibilityFixResult> {
  const fixAll = !neededFields
  const needs = (f: string) => fixAll || neededFields.has(f)

  const focusNote =
    neededFields && neededFields.size > 0
      ? `\nFOCUS: Only generate these fields (others are already passing): ${Array.from(neededFields).join(", ")}`
      : ""

  const system = SYSTEM_BASE + focusNote + "\n\n" + buildSchema(neededFields)

  const prompt = `Optimize GEO signals for this content item so LLMs include it in generated answers:

Title: ${item["title"] ?? ""}
Type: ${item["type"] ?? item["item_type"] ?? ""}
Summary/Overview: ${item["summary"] ?? item["overview"] ?? item["excerpt"] ?? ""}
Problem: ${item["problem"] ?? ""}
Approach: ${item["approach"] ?? ""}
Results: ${item["results"] ?? ""}
Architecture: ${item["architecture"] ?? item["ai_design"] ?? ""}
${needs("ai_summary") ? `Current ai_summary: ${item["ai_summary"] ?? "(none)"}` : ""}
${needs("key_takeaways") ? `Current key_takeaways: ${JSON.stringify(item["key_takeaways"] ?? [])}` : ""}
${needs("concepts") ? `Current concepts: ${JSON.stringify(item["concepts"] ?? [])}` : ""}
${needs("faq") ? `Current FAQ: ${JSON.stringify(item["faq"] ?? [])}` : ""}
${needs("summary") ? `Current summary: ${item["summary"] ?? item["excerpt"] ?? "(none)"}` : ""}
${needs("tags") ? `Current tags: ${JSON.stringify(item["tags"] ?? [])}` : ""}
${needs("expertise_slugs") ? `Current expertise_slugs: ${JSON.stringify(item["expertise_slugs"] ?? [])}\nAvailable expertise slugs to pick from: ${JSON.stringify(availableExpertiseSlugs)}` : ""}
Technologies: ${JSON.stringify(item["tech_stack"] ?? item["technologies"] ?? [])}

Return JSON with ONLY the fields listed in the schema above.`

  try {
    const raw = await generateWithFailover(prompt, system, "visibility")
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim()
    const parsed = JSON.parse(cleaned) as Partial<GeoFix>

    const result: GeoFix = {
      ai_summary: needs("ai_summary")
        ? (parsed.ai_summary ?? String(item["ai_summary"] ?? ""))
        : String(item["ai_summary"] ?? ""),
      key_takeaways: needs("key_takeaways")
        ? (parsed.key_takeaways ?? (item["key_takeaways"] as string[]) ?? [])
        : ((item["key_takeaways"] as string[]) ?? []),
      concepts: needs("concepts")
        ? (parsed.concepts ?? (item["concepts"] as string[]) ?? [])
        : ((item["concepts"] as string[]) ?? []),
      faq: needs("faq")
        ? (parsed.faq ?? (item["faq"] as GeoFix["faq"]) ?? [])
        : ((item["faq"] as GeoFix["faq"]) ?? []),
      summary: needs("summary")
        ? (parsed.summary ?? String(item["summary"] ?? item["excerpt"] ?? ""))
        : String(item["summary"] ?? item["excerpt"] ?? ""),
      tags: needs("tags")
        ? (parsed.tags ?? (item["tags"] as string[]) ?? [])
        : ((item["tags"] as string[]) ?? []),
      expertise_slugs: needs("expertise_slugs")
        ? (parsed.expertise_slugs ?? []).filter((s) =>
            availableExpertiseSlugs.includes(s)
          )
        : ((item["expertise_slugs"] as string[]) ?? []),
      reasoning: parsed.reasoning ?? "",
    }

    return { ok: true, fix: { mode: "geo", fix: result } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "GEO agent failed",
    }
  }
}
