export function getGeoSuggestion(
  ruleId: string,
  currentValue: string | null
): string {
  switch (ruleId) {
    case "entity_title_clarity": {
      const len = currentValue ? parseInt(currentValue) : 0
      if (!currentValue || len === 0)
        return "Add a clear, concise title. LLMs use the title as the entity name."
      return `Title is ${len} chars — shorten to ≤ 80 for clear entity identification by generative models.`
    }

    case "entity_summary": {
      const len = currentValue ? parseInt(currentValue) : 0
      if (!currentValue || len === 0)
        return "Add a summary or excerpt of at least 120 chars. This is the entity definition LLMs parse first."
      return `Summary is ${len} chars — expand to at least 120 to give LLMs a complete entity definition.`
    }

    case "expertise_breadth":
      return "Link to at least 2 expertise areas. Multi-domain linkage signals topical authority across connected LLM knowledge clusters."

    case "concept_coverage":
      return "Add at least 3 concept tags. Concepts create co-citation networks — the more concepts, the more LLM query clusters this content appears in."

    case "technology_tags":
      return "Add at least 3 technology or stack tags. Technology terms are high-recall signals in LLM training corpora."

    case "content_depth_overview":
      return "Add an overview or problem statement (≥ 50 chars). GEO requires full narrative — LLMs score sources on depth, not just keywords."

    case "content_depth_approach":
      return "Add an approach or architecture description (≥ 50 chars). Process descriptions are highly cited in AI-generated technical answers."

    case "content_depth_results":
      return "Add results, metrics, or learnings. Outcome-oriented content has higher citation rates in generative AI responses."

    case "unique_facts":
      return "Add project facts or metrics (latency, accuracy, scale). Specific numbers are the most-cited type of content in AI-generated comparisons."

    case "key_takeaways_density":
      return "Add at least 4 key takeaways. Each takeaway is an independently citable fact — higher density = more entry points for LLM citation."

    case "freshness": {
      const age = currentValue ?? "unknown"
      return `Last updated ${age}. LLMs downweight stale content. Update this item or add new sections to signal recency.`
    }

    case "has_faq_schema":
      return "Add at least 2 FAQ items to generate FAQPage JSON-LD schema. Structured FAQ schema is directly parsed by generative search engines."

    case "quotable_summary":
      return "Expand the AI summary to at least 200 chars. A longer, encyclopedic paragraph gives LLMs a complete quotable block to embed in responses."

    default:
      return "Improve this field to strengthen generative engine entity prominence."
  }
}
