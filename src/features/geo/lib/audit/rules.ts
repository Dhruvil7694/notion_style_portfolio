export type GeoRule = {
  id: string
  label: string
  points: number
}

// GEO = being cited as a source in LLM-generated content, appearing in
// knowledge graph responses, and having high entity prominence in AI models.
export const GEO_RULES: GeoRule[] = [
  // Entity definition — LLMs need a clear, parseable entity
  {
    id: "entity_title_clarity",
    label: "Title ≤ 80 chars (clear entity name)",
    points: 6,
  },
  {
    id: "entity_summary",
    label: "Summary/excerpt ≥ 120 chars (entity definition)",
    points: 8,
  },

  // Knowledge graph connectivity — cross-links = entity web
  {
    id: "expertise_breadth",
    label: "Linked to ≥ 2 expertise areas",
    points: 10,
  },
  { id: "concept_coverage", label: "Has ≥ 3 concept tags", points: 8 },
  { id: "technology_tags", label: "Has ≥ 3 technology/stack tags", points: 6 },

  // Content depth — LLMs cite sources with full narrative coverage
  {
    id: "content_depth_overview",
    label: "Has overview or problem statement",
    points: 8,
  },
  {
    id: "content_depth_approach",
    label: "Has approach or architecture description",
    points: 6,
  },
  {
    id: "content_depth_results",
    label: "Has results, metrics, or learnings",
    points: 8,
  },

  // Unique factual claims — LLMs prefer citable, specific data
  { id: "unique_facts", label: "Has structured facts or metrics", points: 8 },
  { id: "key_takeaways_density", label: "Has ≥ 4 key takeaways", points: 6 },

  // Freshness signal — recency matters to LLMs selecting sources
  { id: "freshness", label: "Updated within 12 months", points: 8 },

  // JSON-LD schema richness — structured data LLMs parse directly
  { id: "has_faq_schema", label: "Has FAQ for FAQPage schema", points: 6 },

  // Citation anchor — ai_summary provides a quotable paragraph
  {
    id: "quotable_summary",
    label: "AI summary ≥ 200 chars (quotable)",
    points: 6,
  },
]

export const GEO_RULES_MAX = GEO_RULES.reduce((s, r) => s + r.points, 0)

type EvalResult = { passed: boolean; currentValue: string | null }

export function evaluateGeoRule(
  ruleId: string,
  item: Record<string, unknown>
): EvalResult {
  switch (ruleId) {
    case "entity_title_clarity": {
      const v = String(item["title"] ?? "")
      return {
        passed: v.length > 0 && v.length <= 80,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "entity_summary": {
      const v = String(
        item["summary"] ?? item["excerpt"] ?? item["ai_summary"] ?? ""
      )
      return {
        passed: v.length >= 120,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "expertise_breadth": {
      const slugs = item["expertise_slugs"]
      const count = Array.isArray(slugs) ? slugs.length : 0
      return {
        passed: count >= 2,
        currentValue: `${count} area${count !== 1 ? "s" : ""}`,
      }
    }
    case "concept_coverage": {
      const concepts = item["concepts"]
      const count = Array.isArray(concepts) ? concepts.length : 0
      return {
        passed: count >= 3,
        currentValue: `${count} concept${count !== 1 ? "s" : ""}`,
      }
    }
    case "technology_tags": {
      const stack = item["tech_stack"]
      const technologies = item["technologies"]
      const tags = item["tags"]
      const count =
        (Array.isArray(stack) ? stack.length : 0) +
        (Array.isArray(technologies) ? technologies.length : 0) +
        (Array.isArray(tags) ? tags.length : 0)
      return {
        passed: count >= 3,
        currentValue: `${count} tag${count !== 1 ? "s" : ""}`,
      }
    }
    case "content_depth_overview": {
      const overview = String(item["overview"] ?? "")
      const problem = String(item["problem"] ?? item["problem_statement"] ?? "")
      const whyBuilt = String(item["why_built"] ?? "")
      const has =
        overview.length >= 50 || problem.length >= 50 || whyBuilt.length >= 50
      return {
        passed: has,
        currentValue: has
          ? `${Math.max(overview.length, problem.length, whyBuilt.length)} chars`
          : null,
      }
    }
    case "content_depth_approach": {
      const approach = String(item["approach"] ?? "")
      const architecture = String(item["architecture"] ?? "")
      const aiDesign = String(item["ai_design"] ?? "")
      const has =
        approach.length >= 50 ||
        architecture.length >= 50 ||
        aiDesign.length >= 50
      return {
        passed: has,
        currentValue: has
          ? `${Math.max(approach.length, architecture.length, aiDesign.length)} chars`
          : null,
      }
    }
    case "content_depth_results": {
      const results = String(item["results"] ?? "")
      const learnings = String(item["learnings"] ?? "")
      const metrics = item["metrics"]
      const hasText = results.length >= 30 || learnings.length >= 30
      const hasMetrics = Array.isArray(metrics) && metrics.length > 0
      return {
        passed: hasText || hasMetrics,
        currentValue: hasMetrics
          ? `${(metrics as unknown[]).length} metrics`
          : hasText
            ? `${Math.max(results.length, learnings.length)} chars`
            : null,
      }
    }
    case "unique_facts": {
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
    case "key_takeaways_density": {
      const kt = item["key_takeaways"]
      const count = Array.isArray(kt) ? kt.length : 0
      return {
        passed: count >= 4,
        currentValue: `${count} takeaway${count !== 1 ? "s" : ""}`,
      }
    }
    case "freshness": {
      const updatedAt = String(item["updated_at"] ?? "")
      if (!updatedAt) return { passed: false, currentValue: null }
      const msPerYear = 365 * 24 * 60 * 60 * 1000
      const age = Date.now() - new Date(updatedAt).getTime()
      const months = Math.floor(age / (msPerYear / 12))
      return {
        passed: age < msPerYear,
        currentValue:
          months < 1
            ? "< 1 month ago"
            : `${months} month${months !== 1 ? "s" : ""} ago`,
      }
    }
    case "has_faq_schema": {
      const faq = item["faq"]
      const count = Array.isArray(faq) ? faq.length : 0
      return {
        passed: count >= 2,
        currentValue:
          count > 0 ? `${count} FAQ item${count !== 1 ? "s" : ""}` : null,
      }
    }
    case "quotable_summary": {
      const v = String(item["ai_summary"] ?? "")
      return {
        passed: v.length >= 200,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    default:
      return { passed: false, currentValue: null }
  }
}
