import type { DiscoverySearchResult } from "@/lib/discovery/types"
import type { KnowledgeEntity, KnowledgeGraphPayload } from "@/lib/knowledge/types"

import type { AiSourceReference } from "./types"

const MAX_CONTEXT_CHARS = 12_000

function formatEntity(entity: KnowledgeEntity): string {
  const lines = [`## ${entity.title} (${entity.type})`, entity.url]

  if (entity.description) {
    lines.push(entity.description)
  }

  if (entity.metadata) {
    for (const [key, value] of Object.entries(entity.metadata)) {
      if (value == null || value === "") continue
      if (Array.isArray(value) && value.length === 0) continue
      lines.push(`${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    }
  }

  return lines.join("\n")
}

export function searchResultsToSources(results: DiscoverySearchResult[]): AiSourceReference[] {
  return results.map((result) => ({
    id: result.id,
    type: result.type,
    title: result.title,
    url: result.url,
    score: result.score,
  }))
}

export function expandRelatedEntities(
  graph: KnowledgeGraphPayload,
  entityIds: string[],
  limit = 12
): KnowledgeEntity[] {
  const relatedIds = new Set<string>()

  for (const entityId of entityIds) {
    for (const rel of graph.relationships) {
      if (rel.sourceId === entityId) {
        relatedIds.add(rel.targetId)
      }
      if (rel.targetId === entityId) {
        relatedIds.add(rel.sourceId)
      }
    }
  }

  for (const id of entityIds) {
    relatedIds.delete(id)
  }

  return [...relatedIds]
    .map((id) => graph.entities.find((entity) => entity.id === id))
    .filter((entity): entity is KnowledgeEntity => Boolean(entity))
    .slice(0, limit)
}

export function buildRetrievalContext(
  primaryResults: DiscoverySearchResult[],
  relatedEntities: KnowledgeEntity[]
): { contextText: string; sources: AiSourceReference[] } {
  const sources = searchResultsToSources(primaryResults)
  const seen = new Set(sources.map((source) => source.id))

  const sections: string[] = []

  if (primaryResults.length > 0) {
    sections.push("# Primary Search Results")
    for (const result of primaryResults) {
      sections.push(
        [
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
      )
    }
  }

  const extraEntities = relatedEntities.filter((entity) => !seen.has(entity.id))
  if (extraEntities.length > 0) {
    sections.push("# Related Knowledge Graph Entities")
    for (const entity of extraEntities) {
      sections.push(formatEntity(entity))
    }
  }

  let contextText = sections.join("\n\n")
  if (contextText.length > MAX_CONTEXT_CHARS) {
    contextText = `${contextText.slice(0, MAX_CONTEXT_CHARS)}\n\n[Context truncated]`
  }

  return { contextText, sources }
}

export function buildCopilotContextSummary(graph: KnowledgeGraphPayload): string {
  const projectCount = graph.entities.filter((e) => e.type === "project").length
  const researchCount = graph.entities.filter((e) => e.type === "research").length
  const writingCount = graph.entities.filter((e) => e.type === "writing").length
  const automationCount = graph.entities.filter((e) => e.type === "automation").length

  return [
    "# Portfolio Summary",
    `Projects: ${projectCount}`,
    `Research: ${researchCount}`,
    `Writing: ${writingCount}`,
    `Automations: ${automationCount}`,
    `Expertise areas: ${graph.expertise.length}`,
    `Technologies: ${graph.technologies.length}`,
    `Concepts: ${graph.concepts.length}`,
    `Graph relationships: ${graph.relationships.length}`,
  ].join("\n")
}
