import type { DiscoverySearchResult } from "@/features/discovery/lib/types"
import type { KnowledgeEntity } from "@/features/knowledge-base/lib/types"

import type { AiSourceReference } from "../types"
import type { CitationBundle } from "./citation-types"
import {
  computeCitationConfidence,
  extractRelatedFromGraph,
  extractSourcesFromResults,
} from "./extract-sources"

export function buildCitations(
  results: DiscoverySearchResult[],
  relatedEntities: KnowledgeEntity[],
  sources: AiSourceReference[]
): CitationBundle {
  const citationSources = extractSourcesFromResults(results)
  const related = extractRelatedFromGraph(sources, relatedEntities)

  const scores = results
    .map((result) => result.score)
    .filter((score) => score > 0)
  const avgScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  return {
    sources: citationSources,
    ...related,
    confidence: computeCitationConfidence(citationSources.length, avgScore),
  }
}

export function formatCitationsForPrompt(citations: CitationBundle): string {
  const lines: string[] = []

  if (citations.sources.length > 0) {
    lines.push("Available sources (cite these when relevant):")
    for (const source of citations.sources) {
      lines.push(`- [${source.title}](${source.url}) (${source.type})`)
    }
  }

  return lines.join("\n")
}
