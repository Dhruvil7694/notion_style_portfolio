import type { DiscoverySearchResult } from "@/lib/discovery/types"
import type { KnowledgeEntity } from "@/lib/knowledge/types"

import type { ContextBudget } from "../settings"
import { buildCategoryBudgets, DEFAULT_TOTAL_BUDGET } from "./allocator"
import { entityCategory, groupResultsByCategory, prioritizeEntities } from "./prioritizer"

function formatResult(result: DiscoverySearchResult): string {
  return [
    `### ${result.title}`,
    `Type: ${result.type}`,
    `URL: ${result.url}`,
    result.description,
    result.technologies.length > 0 ? `Technologies: ${result.technologies.join(", ")}` : "",
    result.expertise.length > 0 ? `Expertise: ${result.expertise.join(", ")}` : "",
    result.concepts.length > 0 ? `Concepts: ${result.concepts.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

function formatEntity(entity: KnowledgeEntity): string {
  const lines = [`## ${entity.title} (${entity.type})`, entity.url]
  if (entity.description) lines.push(entity.description)
  return lines.join("\n")
}

function truncateToBudget(items: string[], budget: number): string {
  let output = ""
  for (const item of items) {
    const next = output ? `${output}\n\n${item}` : item
    if (next.length > budget) {
      const remaining = budget - output.length
      if (remaining > 100) {
        output = `${output}\n\n${item.slice(0, remaining - 20)}\n[truncated]`
      }
      break
    }
    output = next
  }
  return output
}

export function compressContext(
  results: DiscoverySearchResult[],
  relatedEntities: KnowledgeEntity[],
  budget: ContextBudget,
  totalBudget = DEFAULT_TOTAL_BUDGET
): string {
  const categoryBudgets = buildCategoryBudgets(budget, totalBudget)
  const grouped = groupResultsByCategory(results)
  const sections: string[] = []

  for (const [category, categoryBudget] of Object.entries(categoryBudgets)) {
    const items = grouped[category as keyof typeof grouped] ?? []
    if (items.length === 0 || categoryBudget <= 0) continue

    const formatted = items.map(formatResult)
    const compressed = truncateToBudget(formatted, categoryBudget)
    if (compressed) {
      sections.push(`# ${category}\n${compressed}`)
    }
  }

  const entityBudget = Math.floor(totalBudget * 0.15)
  const entities = prioritizeEntities(relatedEntities)
  const entitySections: string[] = []
  let entityChars = 0

  for (const entity of entities) {
    const text = formatEntity(entity)
    if (entityChars + text.length > entityBudget) break
    entitySections.push(text)
    entityChars += text.length
  }

  if (entitySections.length > 0) {
    sections.push(`# Related Entities\n${entitySections.join("\n\n")}`)
  }

  let contextText = sections.join("\n\n")
  if (contextText.length > totalBudget) {
    contextText = `${contextText.slice(0, totalBudget)}\n\n[Context truncated by budget manager]`
  }

  return contextText
}

export { entityCategory }
