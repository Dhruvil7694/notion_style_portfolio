import type { DiscoverySearchResult } from "@/features/discovery/lib/types"
import type { KnowledgeEntity } from "@/features/knowledge-base/lib/types"

import type { BudgetCategory } from "./allocator"

export function prioritizeResults(
  results: DiscoverySearchResult[]
): DiscoverySearchResult[] {
  return [...results].sort((a, b) => b.score - a.score)
}

export function groupResultsByCategory(
  results: DiscoverySearchResult[]
): Partial<Record<BudgetCategory, DiscoverySearchResult[]>> {
  const grouped: Partial<Record<BudgetCategory, DiscoverySearchResult[]>> = {}

  for (const result of results) {
    const category = mapDiscoveryType(result.type)
    const list = grouped[category] ?? []
    list.push(result)
    grouped[category] = list
  }

  return grouped
}

function mapDiscoveryType(type: DiscoverySearchResult["type"]): BudgetCategory {
  if (type === "article") return "article"
  if (type === "project" || type === "research" || type === "automation")
    return type
  if (type === "concept") return "concept"
  if (type === "technology") return "technology"
  return "expertise"
}

export function prioritizeEntities(
  entities: KnowledgeEntity[]
): KnowledgeEntity[] {
  return [...entities].sort((a, b) => a.title.localeCompare(b.title))
}

export function entityCategory(entity: KnowledgeEntity): BudgetCategory {
  if (entity.type === "project") return "project"
  if (entity.type === "research") return "research"
  if (entity.type === "writing") return "article"
  if (entity.type === "automation") return "automation"
  if (entity.type === "concept") return "concept"
  if (entity.type === "technology") return "technology"
  return "expertise"
}
