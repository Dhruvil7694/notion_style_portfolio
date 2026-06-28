import type { SeoItemType } from "./types"

export type SeoRule = {
  id: string
  label: string
  points: number
}

export const SEO_RULES: SeoRule[] = [
  {
    id: "seo_title_length",
    label: "SEO title length (30–60 chars)",
    points: 8,
  },
  {
    id: "seo_desc_length",
    label: "SEO description length (120–160 chars)",
    points: 8,
  },
  { id: "seo_title_keyword", label: "Target keyword in SEO title", points: 10 },
  {
    id: "seo_desc_keyword",
    label: "Target keyword in SEO description",
    points: 8,
  },
  { id: "summary_length", label: "Summary/excerpt ≥ 80 chars", points: 6 },
  { id: "faq_min_count", label: "FAQ has ≥ 3 items", points: 6 },
  { id: "faq_answer_quality", label: "FAQ answers ≥ 40 chars each", points: 5 },
  { id: "ai_summary_depth", label: "AI summary ≥ 100 chars", points: 5 },
  {
    id: "slug_quality",
    label: "Slug hygiene (no underscores/stops)",
    points: 5,
  },
  { id: "tags_or_stack", label: "Has ≥ 2 tags or tech stack items", points: 5 },
  { id: "key_takeaways_count", label: "Has ≥ 2 key takeaways", points: 5 },
]

export const SEO_RULES_MAX = SEO_RULES.reduce((s, r) => s + r.points, 0)

const TARGET_KEYWORDS = ["ai engineer", "applied ai"]

function containsKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return TARGET_KEYWORDS.some((kw) => lower.includes(kw))
}

type EvalResult = { passed: boolean; currentValue: string | null }

const SLUG_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "in",
  "is",
])

export function evaluateSeoRule(
  ruleId: string,
  item: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _itemType: SeoItemType
): EvalResult {
  switch (ruleId) {
    case "seo_title_length": {
      const v = String(item["seo_title"] ?? "")
      return {
        passed: v.length >= 30 && v.length <= 60,
        currentValue: v || null,
      }
    }
    case "seo_desc_length": {
      const v = String(item["seo_description"] ?? "")
      return {
        passed: v.length >= 120 && v.length <= 160,
        currentValue: v || null,
      }
    }
    case "seo_title_keyword": {
      const v = String(item["seo_title"] ?? "")
      return {
        passed: Boolean(v) && containsKeyword(v),
        currentValue: v || null,
      }
    }
    case "seo_desc_keyword": {
      const v = String(item["seo_description"] ?? "")
      return {
        passed: Boolean(v) && containsKeyword(v),
        currentValue: v || null,
      }
    }
    case "summary_length": {
      const v = String(item["summary"] ?? item["excerpt"] ?? "")
      return { passed: v.length >= 80, currentValue: v || null }
    }
    case "faq_min_count": {
      const faq = item["faq"]
      const count = Array.isArray(faq) ? faq.length : 0
      return {
        passed: count >= 3,
        currentValue: `${count} item${count !== 1 ? "s" : ""}`,
      }
    }
    case "faq_answer_quality": {
      const faq = item["faq"]
      if (!Array.isArray(faq) || faq.length === 0) {
        return { passed: false, currentValue: "No FAQ" }
      }
      const allLong = faq.every(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          String((f as Record<string, unknown>)["answer"] ?? "").length >= 40
      )
      return {
        passed: allLong,
        currentValue: `${faq.length} FAQ item${faq.length !== 1 ? "s" : ""}`,
      }
    }
    case "ai_summary_depth": {
      const v = String(item["ai_summary"] ?? "")
      return {
        passed: v.length >= 100,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "slug_quality": {
      const v = String(item["slug"] ?? "")
      const parts = v.split("-")
      const hasStops = parts.some((p) => SLUG_STOP_WORDS.has(p))
      const hasUnderscores = v.includes("_")
      const isLower = v === v.toLowerCase()
      return {
        passed: Boolean(v) && !hasStops && !hasUnderscores && isLower,
        currentValue: v || null,
      }
    }
    case "tags_or_stack": {
      const tags = item["tags"]
      const stack = item["tech_stack"]
      const count =
        (Array.isArray(tags) ? tags.length : 0) +
        (Array.isArray(stack) ? stack.length : 0)
      return {
        passed: count >= 2,
        currentValue: `${count} tag/stack item${count !== 1 ? "s" : ""}`,
      }
    }
    case "key_takeaways_count": {
      const kt = item["key_takeaways"]
      const count = Array.isArray(kt) ? kt.length : 0
      return {
        passed: count >= 2,
        currentValue: `${count} takeaway${count !== 1 ? "s" : ""}`,
      }
    }
    default:
      return { passed: false, currentValue: null }
  }
}
