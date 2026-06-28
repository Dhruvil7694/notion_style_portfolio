export function getSuggestion(
  ruleId: string,
  currentValue: string | null
): string {
  const len = currentValue ? currentValue.length : 0

  switch (ruleId) {
    case "seo_title_length":
      if (!currentValue) return "Add an SEO title (30–60 chars)."
      if (len < 30) return `SEO title is ${len} chars — expand to at least 30.`
      return `SEO title is ${len} chars — trim to 60 or fewer.`

    case "seo_desc_length":
      if (!currentValue) return "Add an SEO description (120–160 chars)."
      if (len < 120)
        return `SEO description is ${len} chars — expand to at least 120.`
      return `SEO description is ${len} chars — trim to 160 or fewer.`

    case "seo_title_keyword":
      if (!currentValue)
        return 'Add an SEO title containing "AI Engineer" or "Applied AI".'
      return 'Add "AI Engineer" or "Applied AI" to your SEO title.'

    case "seo_desc_keyword":
      if (!currentValue)
        return 'Add an SEO description containing "AI Engineer" or "Applied AI".'
      return 'Add "AI Engineer" or "Applied AI" to your SEO description.'

    case "summary_length":
      if (!currentValue)
        return "Add a summary or excerpt of at least 80 characters."
      return `Summary is ${len} chars — expand to at least 80.`

    case "faq_min_count":
      return "Add at least 3 FAQ items. FAQs help win featured snippet slots."

    case "faq_answer_quality":
      return "Each FAQ answer should be at least 40 characters for Google to use as an answer snippet."

    case "ai_summary_depth":
      if (!currentValue) return "Add an AI summary of at least 100 characters."
      return `AI summary is ${len} chars — expand to at least 100.`

    case "slug_quality":
      if (!currentValue)
        return "Set a slug using only lowercase letters, hyphens, and no stop words."
      return `Slug "${currentValue}" contains underscores, capital letters, or stop words (the/a/an). Use only lowercase hyphens.`

    case "tags_or_stack":
      return "Add at least 2 tags or tech stack items to improve topical relevance signals."

    case "key_takeaways_count":
      return "Add at least 2 key takeaways. These feed structured content signals."

    default:
      return "Review and fix this field."
  }
}
