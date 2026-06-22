import type { DiscoverySearchResult } from "@/lib/discovery/types"
import type { KnowledgeEntity } from "@/lib/knowledge/types"

import type { AiSourceReference } from "../types"
import type { CitationEntity } from "./citation-types"

function entityToCitation(entity: KnowledgeEntity): CitationEntity {
  return {
    id: entity.id,
    type: entity.type,
    title: entity.title,
    url: entity.url,
  }
}

function resultToCitation(result: DiscoverySearchResult): CitationEntity {
  return {
    id: result.id,
    type: result.type,
    title: result.title,
    url: result.url,
    score: result.score,
  }
}

export function extractSourcesFromResults(results: DiscoverySearchResult[]): CitationEntity[] {
  return results.map(resultToCitation)
}

export function extractRelatedFromGraph(
  primarySources: AiSourceReference[],
  relatedEntities: KnowledgeEntity[]
): {
  relatedProjects: CitationEntity[]
  relatedTechnologies: CitationEntity[]
  relatedExpertise: CitationEntity[]
  relatedConcepts: CitationEntity[]
} {
  const primaryIds = new Set(primarySources.map((source) => source.id))

  const relatedProjects: CitationEntity[] = []
  const relatedTechnologies: CitationEntity[] = []
  const relatedExpertise: CitationEntity[] = []
  const relatedConcepts: CitationEntity[] = []

  for (const entity of relatedEntities) {
    if (primaryIds.has(entity.id)) continue

    const citation = entityToCitation(entity)

    if (entity.type === "project") relatedProjects.push(citation)
    else if (entity.type === "technology") relatedTechnologies.push(citation)
    else if (entity.type === "expertise") relatedExpertise.push(citation)
    else if (entity.type === "concept") relatedConcepts.push(citation)
  }

  return {
    relatedProjects: relatedProjects.slice(0, 5),
    relatedTechnologies: relatedTechnologies.slice(0, 5),
    relatedExpertise: relatedExpertise.slice(0, 5),
    relatedConcepts: relatedConcepts.slice(0, 5),
  }
}

export function computeCitationConfidence(
  sourceCount: number,
  avgScore: number
): "high" | "medium" | "low" {
  if (sourceCount >= 3 && avgScore >= 8) return "high"
  if (sourceCount >= 1 && avgScore >= 4) return "medium"
  return "low"
}
