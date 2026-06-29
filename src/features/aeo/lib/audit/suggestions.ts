export function getAeoSuggestion(
  ruleId: string,
  currentValue: string | null
): string {
  switch (ruleId) {
    case "faq_exists":
      return "Add FAQ items. FAQ schema is the single strongest signal for being cited in AI answers and winning featured snippets."

    case "faq_count": {
      const count = currentValue ? parseInt(currentValue) : 0
      return `Has ${count} FAQ item${count !== 1 ? "s" : ""} — add more to reach 5. More FAQs = more citation surface area for LLMs.`
    }

    case "faq_answer_depth":
      return "Expand short FAQ answers to at least 60 characters each. Shallow answers are skipped by AI answer engines."

    case "faq_question_quality":
      return "Ensure all FAQ questions end with '?'. Properly formed questions match query patterns used by voice search and AI assistants."

    case "ai_summary_exists":
      return "Add an AI summary. This is the verbatim paragraph AI assistants pull when describing your work."

    case "ai_summary_depth": {
      const len = currentValue ? parseInt(currentValue) : 0
      return `AI summary is ${len} chars — expand to at least 150. Short summaries give LLMs too little to cite.`
    }

    case "ai_summary_answer_style":
      return 'Start the AI summary with the subject/topic, not "I". LLMs prefer third-person, encyclopedic phrasing: "This project builds…" not "I built…"'

    case "key_takeaways_exists":
      return "Add key takeaways. Bulleted facts are the most-cited format in AI-generated summaries."

    case "key_takeaways_count":
      return "Add at least 3 key takeaways. Each takeaway is a discrete fact an AI can independently cite."

    case "expertise_linked":
      return "Link to at least one expertise area. Entity authority from domain linkage increases citation probability."

    case "concept_tags":
      return "Add concept tags. Concepts connect this content to the knowledge graph and improve topical co-citation."

    case "excerpt_answer_style":
      return "Write the excerpt/summary as a direct answer (≥ 100 chars), not a teaser. Answer-style text matches voice search query resolution."

    case "structured_facts":
      return "Add project facts or metrics. Structured numerical data (latency, accuracy, documents processed) is highly cited in AI-generated comparisons."

    default:
      return "Review and improve this field for better AI answer engine coverage."
  }
}
