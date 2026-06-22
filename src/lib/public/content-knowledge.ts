import "server-only"

import { extractEntitiesFromContent } from "@/lib/knowledge/entity-extractor"
import { buildKnowledgeGraph, findRelatedKnowledge } from "@/lib/knowledge/graph"
import { parseFaqItems } from "@/lib/knowledge/schemas"
import type { RelatedKnowledgeBundle } from "@/lib/knowledge/types"
import { getPublishedExpertiseAreas } from "@/lib/public/queries"
import type { Content } from "@/types/database.helpers"

export type ContentKnowledgeContext = {
  aiSummary: string | null
  keyTakeaways: string[]
  faqItems: ReturnType<typeof parseFaqItems>
  expertiseSlugs: string[]
  expertiseTitlesBySlug: Record<string, string>
  relatedKnowledge: RelatedKnowledgeBundle | null
}

function contentEntityId(item: Pick<Content, "id" | "type">): string {
  if (item.type === "blog") {
    return `writing:${item.id}`
  }

  if (item.type === "research") {
    return `research:${item.id}`
  }

  if (item.type === "automation") {
    return `automation:${item.id}`
  }

  return `content:${item.id}`
}

export async function resolveContentKnowledge(
  item: Pick<
    Content,
    | "id"
    | "type"
    | "title"
    | "excerpt"
    | "ai_summary"
    | "key_takeaways"
    | "expertise_slugs"
    | "concepts"
    | "tags"
    | "faq"
  >,
  siteUrl: string | null | undefined
): Promise<ContentKnowledgeContext> {
  const [{ data: expertiseAreas }, graph] = await Promise.all([
    getPublishedExpertiseAreas(),
    siteUrl ? buildKnowledgeGraph(siteUrl) : Promise.resolve(null),
  ])

  const extracted = extractEntitiesFromContent(item)
  const relatedKnowledge = graph
    ? findRelatedKnowledge(graph, {
        id: contentEntityId(item),
        expertiseSlugs: item.expertise_slugs ?? [],
        concepts: extracted.concepts,
        technologySlugs: extracted.technologies,
        tags: item.tags ?? [],
      })
    : null

  return {
    aiSummary: item.ai_summary?.trim() || null,
    keyTakeaways: item.key_takeaways ?? [],
    faqItems: parseFaqItems(item.faq),
    expertiseSlugs: item.expertise_slugs ?? [],
    expertiseTitlesBySlug: Object.fromEntries(
      (expertiseAreas ?? []).map((area) => [area.slug, area.title])
    ),
    relatedKnowledge,
  }
}
