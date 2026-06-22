import "server-only"

import { unstable_cache } from "next/cache"

import { buildDiscoveryIndex } from "@/lib/discovery/indexer"
import { searchDocuments } from "@/lib/discovery/search"
import { buildKnowledgeGraph } from "@/lib/knowledge/graph"

import { buildCitations } from "./citations/build-citations"
import type { CitationBundle } from "./citations/citation-types"
import { compressContext } from "./context-budget/compressor"
import {
  buildRetrievalContext,
  expandRelatedEntities,
  searchResultsToSources,
} from "./context-builder"
import { getAiSettings } from "./get-ai-settings"
import type { AiRetrievalResult } from "./types"

export type EnhancedRetrievalResult = AiRetrievalResult & {
  citations: CitationBundle
}

export async function retrievePortfolioContext(
  siteUrl: string,
  query: string,
  options: { limit?: number } = {}
): Promise<EnhancedRetrievalResult> {
  const limit = options.limit ?? 8
  const settings = await getAiSettings()

  const [index, graph] = await Promise.all([
    buildDiscoveryIndex(siteUrl),
    buildKnowledgeGraph(siteUrl),
  ])

  const results = searchDocuments(index.documents, query, { limit })
  const entityIds = results.map((result) => result.id)
  const relatedEntities = graph ? expandRelatedEntities(graph, entityIds) : []

  const contextText = compressContext(results, relatedEntities, settings.context_budget)
  const { sources } = buildRetrievalContext(results, relatedEntities)
  const citations = buildCitations(results, relatedEntities, sources)

  return {
    query,
    sources,
    contextText,
    entityIds,
    citations,
  }
}

export function generateSuggestedQuestions(siteUrl: string): Promise<string[]> {
  return unstable_cache(
    async () => {
      const graph = await buildKnowledgeGraph(siteUrl)
      if (!graph) return []
      const suggestions: string[] = []

      const featuredProjects = graph.entities
        .filter((e) => e.type === "project")
        .slice(0, 2)

      for (const project of featuredProjects) {
        suggestions.push(`Tell me about ${project.title}`)
      }

      const topTechnologies = graph.technologies.slice(0, 2)
      for (const tech of topTechnologies) {
        suggestions.push(`What projects use ${tech.name}?`)
      }

      const topExpertise = graph.expertise.slice(0, 2)
      for (const area of topExpertise) {
        suggestions.push(`Explain ${area.title} expertise`)
      }

      suggestions.push("What experience does Dhruvil have?")
      suggestions.push("What technologies does he specialize in?")

      return [...new Set(suggestions)].slice(0, 6)
    },
    ["suggested-questions", siteUrl],
    { revalidate: 3600 }
  )()
}

export { searchResultsToSources }
