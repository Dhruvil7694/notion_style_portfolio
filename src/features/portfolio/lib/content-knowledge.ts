import "server-only"

import { extractEntitiesFromContent } from "@/features/knowledge-base/lib/entity-extractor"
import { resolveContentFaqFromRecord } from "@/features/knowledge-base/lib/faq-templates"
import {
  buildKnowledgeGraph,
  findRelatedKnowledge,
} from "@/features/knowledge-base/lib/graph"
import type { FaqItem } from "@/features/knowledge-base/lib/schemas"
import type { RelatedKnowledgeBundle } from "@/features/knowledge-base/lib/types"
import { getPublishedExpertiseAreas } from "@/features/portfolio/lib/queries"
import type { Content } from "@/shared/types/database.helpers"

export type ContentKnowledgeContext = {
  aiSummary: string | null
  keyTakeaways: string[]
  faqItems: FaqItem[]
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
    faqItems: resolveContentFaqFromRecord(item),
    expertiseSlugs: item.expertise_slugs ?? [],
    expertiseTitlesBySlug: Object.fromEntries(
      (expertiseAreas ?? []).map((area) => [area.slug, area.title])
    ),
    relatedKnowledge,
  }
}
