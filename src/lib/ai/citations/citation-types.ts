import type { AiSourceReference } from "../types"

export type CitationConfidence = "high" | "medium" | "low"

export type CitationEntity = {
  id: string
  type: string
  title: string
  url: string
  score?: number
}

export type CitationBundle = {
  sources: CitationEntity[]
  relatedProjects: CitationEntity[]
  relatedTechnologies: CitationEntity[]
  relatedExpertise: CitationEntity[]
  relatedConcepts: CitationEntity[]
  confidence: CitationConfidence
}

export type AssistantCitationPayload = {
  citations: CitationBundle
  suggestions?: string[]
}

export function toCitationEntity(source: AiSourceReference): CitationEntity {
  return {
    id: source.id,
    type: source.type,
    title: source.title,
    url: source.url,
    score: source.score,
  }
}
