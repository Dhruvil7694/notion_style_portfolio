import { rankDiscoveryDocuments } from "./ranking"
import {
  DISCOVERY_TYPE_LABELS,
  DISCOVERY_TYPE_ORDER,
  type DiscoveryDocument,
  type DiscoverySearchContext,
  type DiscoverySearchResult,
  type GroupedDiscoveryResults,
} from "./types"

export type SearchDocumentsOptions = {
  limit?: number
  context?: DiscoverySearchContext
  groupByType?: boolean
}

export function searchDocuments(
  documents: DiscoveryDocument[],
  query: string,
  options: SearchDocumentsOptions = {}
): DiscoverySearchResult[] {
  const { limit = 40, context } = options
  return rankDiscoveryDocuments(documents, query, context).slice(0, limit)
}

export function groupSearchResults(
  results: DiscoverySearchResult[]
): GroupedDiscoveryResults[] {
  const grouped = new Map<string, DiscoverySearchResult[]>()

  for (const result of results) {
    const existing = grouped.get(result.type) ?? []
    existing.push(result)
    grouped.set(result.type, existing)
  }

  return DISCOVERY_TYPE_ORDER.filter((type) => grouped.has(type)).map(
    (type) => ({
      type,
      label: DISCOVERY_TYPE_LABELS[type],
      items: grouped.get(type) ?? [],
    })
  )
}

export function searchDocumentsGrouped(
  documents: DiscoveryDocument[],
  query: string,
  options: SearchDocumentsOptions = {}
): GroupedDiscoveryResults[] {
  const results = searchDocuments(documents, query, options)
  return groupSearchResults(results)
}

export function filterDocumentsByType(
  documents: DiscoveryDocument[],
  type: DiscoveryDocument["type"]
): DiscoveryDocument[] {
  return documents.filter((document) => document.type === type)
}

export function findDocumentBySlug(
  documents: DiscoveryDocument[],
  type: DiscoveryDocument["type"],
  slug: string
): DiscoveryDocument | undefined {
  return documents.find(
    (document) => document.type === type && document.slug === slug
  )
}
