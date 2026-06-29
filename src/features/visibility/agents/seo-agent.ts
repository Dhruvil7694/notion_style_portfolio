import "server-only"

import { generateWithFailover } from "@/features/ai/lib/generate"

import type { SeoFix, VisibilityFixResult } from "./types"

const SYSTEM_BASE = `You are an SEO specialist agent for Dhruvil Patel's AI Engineer portfolio.

Person: Dhruvil Patel, Applied AI Engineer, Pune India, Gold Medallist, builds real production AI systems.
Target queries: "AI Engineer India", "Applied AI Engineer", "LLM Engineer", "production AI systems"

Field specs:
- seo_title: MAXIMUM 60 characters. Must include "AI Engineer" or key technical term. Count carefully.
- seo_description: 120-155 characters. Include secondary keywords + value statement. Count carefully.
- ai_summary: 120-200 word factual summary for AI citation. Third person. Include what was built, tech used, outcomes.
- key_takeaways: 3-5 specific bullet points. Include metrics/numbers where evidence exists.
- faq: 3-5 Q&A pairs optimized for featured snippets. Questions end with "?". Answers 40-80 words each.
- summary: 100-160 char plain-text excerpt. Factual, keyword-rich, third person.
- tags: 3-6 topic tags relevant to the content (e.g. "LangGraph", "RAG", "Multi-Agent").

Rules:
- Do not invent facts
- seo_title and seo_description character limits are HARD — count every character
- Return ONLY valid JSON, no markdown fences`

function buildSchema(neededFields?: Set<string>): string {
  const all = !neededFields
  return `Output schema (only include fields listed here):
{
  ${all || neededFields.has("seo_title") ? `"seo_title": "string MAX 60 chars",` : ""}
  ${all || neededFields.has("seo_description") ? `"seo_description": "string 120-155 chars",` : ""}
  ${all || neededFields.has("ai_summary") ? `"ai_summary": "string 120-200 words",` : ""}
  ${all || neededFields.has("key_takeaways") ? `"key_takeaways": ["string", "..."],` : ""}
  ${all || neededFields.has("faq") ? `"faq": [{"question": "string ends with ?", "answer": "string 40-80 words"}, "..."],` : ""}
  ${all || neededFields.has("summary") ? `"summary": "string 100-160 chars",` : ""}
  ${all || neededFields.has("tags") ? `"tags": ["string", "..."],` : ""}
  "reasoning": "1-2 sentences on what was improved"
}`
}

export async function runSeoAgent(
  item: Record<string, unknown>,
  neededFields?: Set<string>
): Promise<VisibilityFixResult> {
  const fixAll = !neededFields
  const needs = (f: string) => fixAll || neededFields.has(f)

  const focusNote =
    neededFields && neededFields.size > 0
      ? `\nFOCUS: Only generate these fields (others are already passing): ${Array.from(neededFields).join(", ")}`
      : ""

  const system = SYSTEM_BASE + focusNote + "\n\n" + buildSchema(neededFields)

  const prompt = `Optimize SEO signals for this content item:

Title: ${item["title"] ?? ""}
Type: ${item["type"] ?? item["item_type"] ?? ""}
Excerpt/Summary: ${item["excerpt"] ?? item["summary"] ?? item["ai_summary"] ?? ""}
Overview: ${item["overview"] ?? ""}
Problem: ${item["problem"] ?? ""}
Approach: ${item["approach"] ?? ""}
Results: ${item["results"] ?? ""}
${needs("seo_title") ? `Current seo_title: ${item["seo_title"] ?? "(none)"}` : ""}
${needs("seo_description") ? `Current seo_description: ${item["seo_description"] ?? "(none)"}` : ""}
${needs("ai_summary") ? `Current ai_summary: ${item["ai_summary"] ?? "(none)"}` : ""}
${needs("key_takeaways") ? `Current key_takeaways: ${JSON.stringify(item["key_takeaways"] ?? [])}` : ""}
${needs("faq") ? `Current FAQ: ${JSON.stringify(item["faq"] ?? [])}` : ""}
${needs("summary") ? `Current summary: ${item["summary"] ?? item["excerpt"] ?? "(none)"}` : ""}
${needs("tags") ? `Current tags: ${JSON.stringify(item["tags"] ?? [])}` : ""}
Tags/Concepts: ${JSON.stringify(item["tags"] ?? item["concepts"] ?? [])}
Expertise areas: ${JSON.stringify(item["expertise_slugs"] ?? [])}
Technologies: ${JSON.stringify(item["tech_stack"] ?? item["technologies"] ?? [])}

Return JSON with ONLY the fields listed in the schema above.`

  try {
    const raw = await generateWithFailover(prompt, system, "visibility")
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim()
    const parsed = JSON.parse(cleaned) as Partial<SeoFix>

    const result: SeoFix = {
      seo_title: needs("seo_title")
        ? (parsed.seo_title ?? String(item["seo_title"] ?? ""))
        : String(item["seo_title"] ?? ""),
      seo_description: needs("seo_description")
        ? (parsed.seo_description ?? String(item["seo_description"] ?? ""))
        : String(item["seo_description"] ?? ""),
      ai_summary: needs("ai_summary")
        ? (parsed.ai_summary ?? String(item["ai_summary"] ?? ""))
        : String(item["ai_summary"] ?? ""),
      key_takeaways: needs("key_takeaways")
        ? (parsed.key_takeaways ?? (item["key_takeaways"] as string[]) ?? [])
        : ((item["key_takeaways"] as string[]) ?? []),
      faq: needs("faq")
        ? (parsed.faq ?? (item["faq"] as SeoFix["faq"]) ?? [])
        : ((item["faq"] as SeoFix["faq"]) ?? []),
      summary: needs("summary")
        ? (parsed.summary ?? String(item["summary"] ?? item["excerpt"] ?? ""))
        : String(item["summary"] ?? item["excerpt"] ?? ""),
      tags: needs("tags")
        ? (parsed.tags ?? (item["tags"] as string[]) ?? [])
        : ((item["tags"] as string[]) ?? []),
      reasoning: parsed.reasoning ?? "",
    }

    return { ok: true, fix: { mode: "seo", fix: result } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "SEO agent failed",
    }
  }
}
