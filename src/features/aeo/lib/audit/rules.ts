export type AeoRule = {
  id: string
  label: string
  points: number
}

export const AEO_RULES: AeoRule[] = [
  // FAQ quality — the #1 AEO signal (Q&A schema wins featured snippets + LLM citations)
  { id: "faq_exists", label: "Has FAQ items", points: 12 },
  { id: "faq_count", label: "FAQ has ≥ 5 items", points: 8 },
  { id: "faq_answer_depth", label: "FAQ answers ≥ 60 chars each", points: 8 },
  {
    id: "faq_question_quality",
    label: "FAQ questions end with '?'",
    points: 4,
  },

  // AI summary — verbatim paragraph pulled by LLMs
  { id: "ai_summary_exists", label: "Has AI summary", points: 10 },
  { id: "ai_summary_depth", label: "AI summary ≥ 150 chars", points: 6 },
  {
    id: "ai_summary_answer_style",
    label: "AI summary starts with subject (not 'I')",
    points: 4,
  },

  // Key takeaways — bulleted facts LLMs prefer to cite
  { id: "key_takeaways_exists", label: "Has key takeaways", points: 8 },
  { id: "key_takeaways_count", label: "Has ≥ 3 key takeaways", points: 6 },

  // Entity authority — linked to known expertise domains
  { id: "expertise_linked", label: "Linked to ≥ 1 expertise area", points: 8 },
  { id: "concept_tags", label: "Has concept tags", points: 5 },

  // Answer-style excerpt/summary — phrased as answer, not teaser
  {
    id: "excerpt_answer_style",
    label: "Excerpt/summary ≥ 100 chars",
    points: 6,
  },

  // Structured facts — parseable data LLMs can cite
  {
    id: "structured_facts",
    label: "Has structured facts or metrics",
    points: 5,
  },
]

export const AEO_RULES_MAX = AEO_RULES.reduce((s, r) => s + r.points, 0)

type EvalResult = { passed: boolean; currentValue: string | null }

export function evaluateAeoRule(
  ruleId: string,
  item: Record<string, unknown>
): EvalResult {
  switch (ruleId) {
    case "faq_exists": {
      const faq = item["faq"]
      const count = Array.isArray(faq) ? faq.length : 0
      return {
        passed: count > 0,
        currentValue:
          count > 0 ? `${count} item${count !== 1 ? "s" : ""}` : null,
      }
    }
    case "faq_count": {
      const faq = item["faq"]
      const count = Array.isArray(faq) ? faq.length : 0
      return {
        passed: count >= 5,
        currentValue: `${count} item${count !== 1 ? "s" : ""}`,
      }
    }
    case "faq_answer_depth": {
      const faq = item["faq"]
      if (!Array.isArray(faq) || faq.length === 0) {
        return { passed: false, currentValue: "No FAQ" }
      }
      const allDeep = faq.every(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          String((f as Record<string, unknown>)["answer"] ?? "").length >= 60
      )
      const shortCount = faq.filter(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          String((f as Record<string, unknown>)["answer"] ?? "").length < 60
      ).length
      return {
        passed: allDeep,
        currentValue:
          shortCount > 0
            ? `${shortCount} answer${shortCount !== 1 ? "s" : ""} too short`
            : `${faq.length} deep answers`,
      }
    }
    case "faq_question_quality": {
      const faq = item["faq"]
      if (!Array.isArray(faq) || faq.length === 0) {
        return { passed: false, currentValue: "No FAQ" }
      }
      const allQuestions = faq.every(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          String((f as Record<string, unknown>)["question"] ?? "")
            .trim()
            .endsWith("?")
      )
      return {
        passed: allQuestions,
        currentValue: `${faq.length} question${faq.length !== 1 ? "s" : ""}`,
      }
    }
    case "ai_summary_exists": {
      const v = String(item["ai_summary"] ?? "")
      return {
        passed: v.length > 0,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "ai_summary_depth": {
      const v = String(item["ai_summary"] ?? "")
      return {
        passed: v.length >= 150,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "ai_summary_answer_style": {
      const v = String(item["ai_summary"] ?? "").trim()
      if (!v) return { passed: false, currentValue: null }
      const startsWithI = /^I\s/i.test(v) || v.toLowerCase().startsWith("i ")
      return {
        passed: !startsWithI,
        currentValue: v.slice(0, 60) + (v.length > 60 ? "…" : ""),
      }
    }
    case "key_takeaways_exists": {
      const kt = item["key_takeaways"]
      const count = Array.isArray(kt) ? kt.length : 0
      return {
        passed: count > 0,
        currentValue:
          count > 0 ? `${count} takeaway${count !== 1 ? "s" : ""}` : null,
      }
    }
    case "key_takeaways_count": {
      const kt = item["key_takeaways"]
      const count = Array.isArray(kt) ? kt.length : 0
      return {
        passed: count >= 3,
        currentValue: `${count} takeaway${count !== 1 ? "s" : ""}`,
      }
    }
    case "expertise_linked": {
      const slugs = item["expertise_slugs"]
      const count = Array.isArray(slugs) ? slugs.length : 0
      return {
        passed: count >= 1,
        currentValue:
          count > 0 ? `${count} area${count !== 1 ? "s" : ""}` : null,
      }
    }
    case "concept_tags": {
      const concepts = item["concepts"]
      const count = Array.isArray(concepts) ? concepts.length : 0
      return {
        passed: count >= 1,
        currentValue:
          count > 0 ? `${count} concept${count !== 1 ? "s" : ""}` : null,
      }
    }
    case "excerpt_answer_style": {
      const v = String(
        item["summary"] ?? item["excerpt"] ?? item["ai_summary"] ?? ""
      )
      return {
        passed: v.length >= 100,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "structured_facts": {
      const facts = item["project_facts"]
      const metrics = item["metrics"]
      const hasFacts =
        typeof facts === "object" &&
        facts !== null &&
        Object.keys(facts as object).length > 0
      const hasMetrics = Array.isArray(metrics) && metrics.length > 0
      return {
        passed: hasFacts || hasMetrics,
        currentValue: hasFacts
          ? `${Object.keys(facts as object).length} facts`
          : hasMetrics
            ? `${(metrics as unknown[]).length} metrics`
            : null,
      }
    }
    default:
      return { passed: false, currentValue: null }
  }
}
