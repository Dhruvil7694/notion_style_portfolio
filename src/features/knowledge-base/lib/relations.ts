import type {
  KnowledgeRelation,
  KnowledgeRelationType,
} from "@/features/knowledge-base/lib/types"

let relationCounter = 0

function nextRelationId(): string {
  relationCounter += 1
  return `rel-${relationCounter}`
}

export function createRelation(
  sourceId: string,
  targetId: string,
  type: KnowledgeRelationType,
  weight = 1
): KnowledgeRelation {
  return {
    id: nextRelationId(),
    sourceId,
    targetId,
    type,
    weight,
  }
}

export function relationsForExpertiseLinks(
  sourceId: string,
  expertiseSlugs: string[]
): KnowledgeRelation[] {
  return expertiseSlugs.map((slug) =>
    createRelation(sourceId, `expertise:${slug}`, "uses_expertise", 2)
  )
}

export function relationsForRelatedExpertiseLinks(
  sourceExpertiseSlug: string,
  relatedSlugs: string[]
): KnowledgeRelation[] {
  return relatedSlugs.map((slug) =>
    createRelation(
      `expertise:${sourceExpertiseSlug}`,
      `expertise:${slug}`,
      "related_expertise",
      2
    )
  )
}

export function relationsForTechnologyLinks(
  sourceId: string,
  technologySlugs: string[]
): KnowledgeRelation[] {
  return technologySlugs.map((slug) =>
    createRelation(sourceId, `technology:${slug}`, "uses_technology", 3)
  )
}

export function relationsForConceptLinks(
  sourceId: string,
  concepts: string[]
): KnowledgeRelation[] {
  return concepts.map((concept) => {
    const slug = concept
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return createRelation(sourceId, `concept:${slug}`, "mentions_concept", 5)
  })
}

export function relationsForRelatedConceptLinks(
  sourceConceptSlug: string,
  relatedSlugs: string[]
): KnowledgeRelation[] {
  return relatedSlugs.map((slug) =>
    createRelation(
      `concept:${sourceConceptSlug}`,
      `concept:${slug}`,
      "related_to",
      5
    )
  )
}

export function scoreSharedTags(left: string[], right: string[]): number {
  const leftSet = new Set(left.map((value) => value.toLowerCase()))
  let score = 0

  for (const tag of right) {
    if (leftSet.has(tag.toLowerCase())) {
      score += 1
    }
  }

  return score
}

export function scoreSharedSlugs(left: string[], right: string[]): number {
  const leftSet = new Set(left)
  let score = 0

  for (const slug of right) {
    if (leftSet.has(slug)) {
      score += 2
    }
  }

  return score
}
