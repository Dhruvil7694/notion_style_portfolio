import "server-only"

import { generateWithFailover } from "@/features/ai/lib/generate"

import type { AeoFix, VisibilityFixResult } from "./types"

const SYSTEM_BASE = `You are an AEO (Answer Engine Optimization) specialist agent for an AI Engineer portfolio. Improve content so AI assistants (ChatGPT, Perplexity, Claude, Gemini) cite it.

Field specs:
- ai_summary: 2-3 paragraph summary, third person, factual, 150-300 words. Include: who built it, what was built, key technical decisions, measurable outcomes.
- key_takeaways: 4-6 bullet points, 8-15 words each, concrete and specific, prefer metrics.
- faq: Q&A pairs. Questions start with Who/What/How/Why/When/Can/Does, end with "?". Answers 60-120 words, direct. Min 5 items.
- concepts: semantic concept slugs (lowercase-hyphenated). 3-8 slugs. E.g. "retrieval-augmented-generation", "multi-agent-systems".
- summary: 120-200 char plain-text excerpt, third person, factual.
- expertise_slugs: pick MOST RELEVANT slugs from the provided available list ONLY. 1-3 max. Empty array if none fit.

Rules:
- Sound authoritative and factual, not promotional
- Do not invent facts not in the source content
- Return ONLY valid JSON, no markdown fences`

function buildSchema(neededFields?: Set<string>): string {
  const all = !neededFields
  return `Output schema (only include fields listed here):
{
  ${all || neededFields.has("ai_summary") ? `"ai_summary": "string 150-300 words",` : ""}
  ${all || neededFields.has("key_takeaways") ? `"key_takeaways": ["string", "..."],` : ""}
  ${all || neededFields.has("faq") ? `"faq": [{"question": "string ends with ?", "answer": "string 60-120 words"}, "..."],` : ""}
  ${all || neededFields.has("concepts") ? `"concepts": ["slug", "..."],` : ""}
  ${all || neededFields.has("summary") ? `"summary": "string 120-200 chars",` : ""}
  ${all || neededFields.has("expertise_slugs") ? `"expertise_slugs": ["slug-from-available-list", "..."],` : ""}
  "reasoning": "1-2 sentences on what you fixed and why"
}`
}

export async function runAeoAgent(
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

  const prompt = `Optimize AEO signals for this content item:

Title: ${item["title"] ?? ""}
Type: ${item["type"] ?? item["item_type"] ?? ""}
Summary/Overview: ${item["summary"] ?? item["overview"] ?? item["excerpt"] ?? ""}
Problem: ${item["problem"] ?? ""}
Approach: ${item["approach"] ?? ""}
Results: ${item["results"] ?? ""}
Learnings: ${item["learnings"] ?? ""}
${needs("ai_summary") ? `Current ai_summary: ${item["ai_summary"] ?? "(none)"}` : ""}
${needs("key_takeaways") ? `Current key_takeaways: ${JSON.stringify(item["key_takeaways"] ?? [])}` : ""}
${needs("faq") ? `Current FAQ: ${JSON.stringify(item["faq"] ?? [])}` : ""}
${needs("concepts") ? `Current concepts: ${JSON.stringify(item["concepts"] ?? [])}` : ""}
${needs("summary") ? `Current summary: ${item["summary"] ?? item["excerpt"] ?? "(none)"}` : ""}
${needs("expertise_slugs") ? `Current expertise_slugs: ${JSON.stringify(item["expertise_slugs"] ?? [])}\nAvailable expertise slugs to pick from: ${JSON.stringify(availableExpertiseSlugs)}` : ""}
Technologies: ${JSON.stringify(item["tech_stack"] ?? item["technologies"] ?? [])}

Return JSON with ONLY the fields listed in the schema above.`

  try {
    const raw = await generateWithFailover(prompt, system, "visibility")
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim()
    const parsed = JSON.parse(cleaned) as Partial<AeoFix>

    // Merge: use AI value for needed fields, fallback to existing for others
    const result: AeoFix = {
      ai_summary: needs("ai_summary")
        ? (parsed.ai_summary ?? String(item["ai_summary"] ?? ""))
        : String(item["ai_summary"] ?? ""),
      key_takeaways: needs("key_takeaways")
        ? (parsed.key_takeaways ?? (item["key_takeaways"] as string[]) ?? [])
        : ((item["key_takeaways"] as string[]) ?? []),
      faq: needs("faq")
        ? (parsed.faq ?? (item["faq"] as AeoFix["faq"]) ?? [])
        : ((item["faq"] as AeoFix["faq"]) ?? []),
      concepts: needs("concepts")
        ? (parsed.concepts ?? (item["concepts"] as string[]) ?? [])
        : ((item["concepts"] as string[]) ?? []),
      summary: needs("summary")
        ? (parsed.summary ?? String(item["summary"] ?? item["excerpt"] ?? ""))
        : String(item["summary"] ?? item["excerpt"] ?? ""),
      expertise_slugs: needs("expertise_slugs")
        ? (parsed.expertise_slugs ?? []).filter((s) =>
            availableExpertiseSlugs.includes(s)
          )
        : ((item["expertise_slugs"] as string[]) ?? []),
      reasoning: parsed.reasoning ?? "",
    }

    return { ok: true, fix: { mode: "aeo", fix: result } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AEO agent failed",
    }
  }
}
