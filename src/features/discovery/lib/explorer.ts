import "server-only"

import { normalizeConceptSlug } from "@/features/knowledge-base/lib/scoring"
import { normalizeTechnologySlug } from "@/features/knowledge-base/lib/taxonomy"
import type { KnowledgeGraphPayload } from "@/features/knowledge-base/lib/types"

import { buildDiscoveryIndexFromGraph } from "./indexer"
import { rankDiscoveryDocuments } from "./ranking"
import type {
  DiscoveryDocument,
  EntityNavigationBundle,
  TopicCluster,
} from "./types"

function documentsById(
  documents: DiscoveryDocument[]
): Map<string, DiscoveryDocument> {
  return new Map(documents.map((document) => [document.id, document]))
}

function pickDocuments(
  ids: string[],
  lookup: Map<string, DiscoveryDocument>,
  limit = 6
): DiscoveryDocument[] {
  const seen = new Set<string>()
  const results: DiscoveryDocument[] = []

  for (const id of ids) {
    if (seen.has(id)) {
      continue
    }

    const document = lookup.get(id)
    if (!document) {
      continue
    }

    seen.add(id)
    results.push(document)

    if (results.length >= limit) {
      break
    }
  }

  return results
}

function linkedContentIds(
  graph: KnowledgeGraphPayload,
  entityId: string
): string[] {
  return graph.relationships
    .filter((rel) => rel.targetId === entityId)
    .map((rel) => rel.sourceId)
}

function coLinkedEntityIds(
  graph: KnowledgeGraphPayload,
  sourceEntityId: string,
  relationType: string
): string[] {
  const linkedSources = new Set(linkedContentIds(graph, sourceEntityId))
  const counts = new Map<string, number>()

  for (const rel of graph.relationships) {
    if (!linkedSources.has(rel.sourceId) || rel.type !== relationType) {
      continue
    }

    if (rel.targetId === sourceEntityId) {
      continue
    }

    counts.set(rel.targetId, (counts.get(rel.targetId) ?? 0) + 1)
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

export function resolveEntityNavigation(
  graph: KnowledgeGraphPayload,
  entityType: "expertise" | "technology" | "concept",
  slug: string
): EntityNavigationBundle {
  const documents = buildDiscoveryIndexFromGraph(graph)
  const lookup = documentsById(documents)
  const normalizedSlug =
    entityType === "concept"
      ? normalizeConceptSlug(slug)
      : entityType === "technology"
        ? normalizeTechnologySlug(slug)
        : slug
  const entityId = `${entityType}:${normalizedSlug}`

  const relatedContentIds = linkedContentIds(graph, entityId)
  const relatedContent = pickDocuments(relatedContentIds, lookup, 8)

  if (entityType === "expertise") {
    const area = graph.expertise.find((item) => item.slug === slug)
    const relatedExpertiseIds = (area?.related_expertise_slugs ?? []).map(
      (item) => `expertise:${item}`
    )
    const techIds = coLinkedEntityIds(graph, entityId, "uses_technology")
    const conceptIds = coLinkedEntityIds(graph, entityId, "mentions_concept")

    return {
      relatedExpertise: pickDocuments(relatedExpertiseIds, lookup),
      relatedTechnologies: pickDocuments(techIds, lookup),
      relatedConcepts: pickDocuments(conceptIds, lookup),
      relatedContent,
    }
  }

  if (entityType === "technology") {
    const expertiseIds = coLinkedEntityIds(graph, entityId, "uses_expertise")
    const conceptIds = coLinkedEntityIds(graph, entityId, "mentions_concept")
    const techIds = coLinkedEntityIds(graph, entityId, "uses_technology")

    return {
      relatedExpertise: pickDocuments(expertiseIds, lookup),
      relatedTechnologies: pickDocuments(techIds, lookup),
      relatedConcepts: pickDocuments(conceptIds, lookup),
      relatedContent,
    }
  }

  const relatedConceptIds = graph.relationships
    .filter(
      (rel) =>
        rel.type === "related_to" &&
        (rel.sourceId === entityId || rel.targetId === entityId)
    )
    .map((rel) => (rel.sourceId === entityId ? rel.targetId : rel.sourceId))

  const conceptEntity = graph.entities.find((entity) => entity.id === entityId)
  const relatedExpertiseSlugs = Array.isArray(
    conceptEntity?.metadata?.relatedExpertiseSlugs
  )
    ? conceptEntity.metadata.relatedExpertiseSlugs.filter(
        (item): item is string => typeof item === "string"
      )
    : []

  const relatedExpertiseIds = relatedExpertiseSlugs.map(
    (item) => `expertise:${item}`
  )

  const linkedExpertiseIds = coLinkedEntityIds(
    graph,
    entityId,
    "uses_expertise"
  )
  const techIds = coLinkedEntityIds(graph, entityId, "uses_technology")

  return {
    relatedExpertise: pickDocuments(
      [...relatedExpertiseIds, ...linkedExpertiseIds],
      lookup
    ),
    relatedTechnologies: pickDocuments(techIds, lookup),
    relatedConcepts: pickDocuments(relatedConceptIds, lookup),
    relatedContent,
  }
}

function buildClusterFromAnchor(
  graph: KnowledgeGraphPayload,
  documents: DiscoveryDocument[],
  anchor: DiscoveryDocument
): TopicCluster {
  const related = rankDiscoveryDocuments(documents, anchor.title, {
    expertise: anchor.expertise,
    technologies: anchor.technologies,
    concepts: anchor.concepts,
    relatedIds: linkedContentIds(graph, anchor.id),
  }).slice(0, 12)

  const byType = (type: DiscoveryDocument["type"]) =>
    related.filter((item) => item.type === type && item.id !== anchor.id)

  return {
    id: anchor.id,
    title: anchor.title,
    anchorType:
      anchor.type === "expertise"
        ? "expertise"
        : anchor.type === "concept"
          ? "concept"
          : "technology",
    anchorSlug: anchor.slug,
    projects: byType("project"),
    research: byType("research"),
    articles: byType("article"),
    automations: byType("automation"),
    concepts: byType("concept"),
    technologies: byType("technology"),
    expertise: byType("expertise"),
  }
}

export function buildTopicClusters(
  graph: KnowledgeGraphPayload,
  limit = 6
): TopicCluster[] {
  const documents = buildDiscoveryIndexFromGraph(graph)
  const anchors = documents
    .filter(
      (document) =>
        document.type === "expertise" ||
        document.type === "concept" ||
        (document.type === "technology" && document.popularity >= 3)
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)

  return anchors.map((anchor) =>
    buildClusterFromAnchor(graph, documents, anchor)
  )
}

export function getPopularTopics(
  documents: DiscoveryDocument[],
  limit = 8
): DiscoveryDocument[] {
  return [...documents]
    .filter(
      (document) => document.type === "concept" || document.type === "expertise"
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function getRecentlyUpdated(
  documents: DiscoveryDocument[],
  limit = 8
): DiscoveryDocument[] {
  return [...documents]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, limit)
}

export function getFeaturedProjects(
  documents: DiscoveryDocument[],
  limit = 4
): DiscoveryDocument[] {
  return documents
    .filter((document) => document.type === "project")
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function getFeaturedConcepts(
  documents: DiscoveryDocument[],
  limit = 4
): DiscoveryDocument[] {
  return documents
    .filter((document) => document.type === "concept")
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function getFeaturedExpertise(
  documents: DiscoveryDocument[],
  limit = 4
): DiscoveryDocument[] {
  return documents
    .filter((document) => document.type === "expertise")
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function getExplorerSections(documents: DiscoveryDocument[]) {
  return {
    projects: documents.filter((document) => document.type === "project"),
    research: documents.filter((document) => document.type === "research"),
    articles: documents.filter((document) => document.type === "article"),
    automations: documents.filter((document) => document.type === "automation"),
    expertise: documents.filter((document) => document.type === "expertise"),
    technologies: documents.filter(
      (document) => document.type === "technology"
    ),
    concepts: documents.filter((document) => document.type === "concept"),
    popularTopics: getPopularTopics(documents),
    recentlyUpdated: getRecentlyUpdated(documents),
    featuredExpertise: getFeaturedExpertise(documents),
    featuredProjects: getFeaturedProjects(documents),
    featuredConcepts: getFeaturedConcepts(documents),
  }
}
