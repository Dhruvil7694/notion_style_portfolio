import "server-only"

import { unstable_cache } from "next/cache"

import { buildKnowledgeGraph } from "@/features/knowledge-base/lib/graph"
import { normalizeConceptSlug } from "@/features/knowledge-base/lib/scoring"
import type {
  KnowledgeEntity,
  KnowledgeGraphPayload,
} from "@/features/knowledge-base/lib/types"
import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from "@/features/portfolio/lib/cache-tags"

import type {
  DiscoveryDocument,
  DiscoveryDocumentType,
  DiscoveryIndexPayload,
} from "./types"

function mapEntityType(
  type: KnowledgeEntity["type"]
): DiscoveryDocumentType | null {
  if (type === "writing") {
    return "article"
  }

  if (
    type === "project" ||
    type === "research" ||
    type === "automation" ||
    type === "expertise" ||
    type === "technology" ||
    type === "concept"
  ) {
    return type
  }

  return null
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function computePopularity(
  entity: KnowledgeEntity,
  graph: KnowledgeGraphPayload
): number {
  const inbound = graph.relationships.filter(
    (rel) => rel.targetId === entity.id || rel.sourceId === entity.id
  ).length

  const featured =
    entity.type === "expertise"
      ? graph.expertise.find((item) => item.slug === entity.slug)?.featured
      : entity.type === "technology"
        ? graph.technologies.find((item) => item.slug === entity.slug)
            ?.registered
        : entity.type === "concept"
          ? graph.concepts.find((item) => item.slug === entity.slug)?.registered
          : false

  return inbound + (featured ? 5 : 0)
}

function entityToDiscoveryDocument(
  entity: KnowledgeEntity,
  graph: KnowledgeGraphPayload
): DiscoveryDocument | null {
  const type = mapEntityType(entity.type)
  if (!type) {
    return null
  }

  const expertise =
    entity.type === "expertise"
      ? [entity.slug]
      : readStringArray(entity.metadata?.expertiseSlugs)
  const technologies =
    entity.type === "technology"
      ? [entity.slug]
      : readStringArray(entity.metadata?.technologies)
  const concepts =
    entity.type === "concept"
      ? [normalizeConceptSlug(entity.slug)]
      : readStringArray(entity.metadata?.concepts).map(normalizeConceptSlug)
  const tags = readStringArray(entity.metadata?.tags)
  const keywords = readStringArray(entity.metadata?.keywords)

  const updatedAt =
    entity.updatedAt ?? entity.publishedAt ?? new Date(0).toISOString()

  return {
    id: entity.id,
    type,
    title: entity.title,
    description: entity.description ?? "",
    slug: entity.slug,
    url: entity.url,
    keywords: [
      ...new Set([
        entity.title,
        ...keywords,
        ...tags,
        ...concepts,
        ...technologies,
        ...expertise,
      ]),
    ],
    expertise,
    technologies,
    concepts,
    popularity: computePopularity(entity, graph),
    updatedAt,
  }
}

export function buildDiscoveryIndexFromGraph(
  graph: KnowledgeGraphPayload
): DiscoveryDocument[] {
  return graph.entities
    .map((entity) => entityToDiscoveryDocument(entity, graph))
    .filter((document): document is DiscoveryDocument => document !== null)
    .sort(
      (a, b) => b.popularity - a.popularity || a.title.localeCompare(b.title)
    )
}

async function buildDiscoveryIndexUncached(
  siteUrl: string
): Promise<DiscoveryIndexPayload> {
  const graph = await buildKnowledgeGraph(siteUrl)

  if (!graph) {
    return {
      documents: [],
      generatedAt: new Date().toISOString(),
    }
  }

  return {
    documents: buildDiscoveryIndexFromGraph(graph),
    generatedAt: new Date().toISOString(),
  }
}

function getCachedDiscoveryIndex(siteUrl: string) {
  return unstable_cache(
    () => buildDiscoveryIndexUncached(siteUrl),
    ["public-discovery-index", siteUrl],
    {
      tags: [PUBLIC_CACHE_TAGS.discovery, PUBLIC_CACHE_TAGS.knowledgeGraph],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function buildDiscoveryIndex(
  siteUrl: string
): Promise<DiscoveryIndexPayload> {
  return getCachedDiscoveryIndex(siteUrl)()
}

export async function getDiscoveryDocuments(
  siteUrl: string
): Promise<DiscoveryDocument[]> {
  const index = await buildDiscoveryIndex(siteUrl)
  return index.documents
}
