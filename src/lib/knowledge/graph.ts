import "server-only"

import { unstable_cache } from "next/cache"

import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from "@/lib/public/cache-tags"
import {
  getPublishedConceptRegistry,
  getPublishedContent,
  getPublishedExpertiseAreas,
  getPublishedProjects,
  getPublishedTechnologyRegistry,
} from "@/lib/public/queries"
import { collectStackTechnologyNames } from "@/lib/public/stack-registry"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import type { Content, Project } from "@/types/database.helpers"

import {
  buildContentEntityMetadata,
  buildProjectEntityMetadata,
  conceptToEntity,
  contentToEntity,
  expertiseToEntity,
  projectToEntity,
  technologyToEntity,
} from "./entities"
import { extractEntitiesFromContent, extractEntitiesFromProject } from "./entity-extractor"
import {
  relationsForConceptLinks,
  relationsForExpertiseLinks,
  relationsForRelatedConceptLinks,
  relationsForRelatedExpertiseLinks,
  relationsForTechnologyLinks,
} from "./relations"
import { normalizeConceptSlug, RELATED_CONTENT_WEIGHTS, scoreWeightedOverlap } from "./scoring"
import { normalizeTechnologySlug } from "./taxonomy"
import type {
  KnowledgeEntity,
  KnowledgeGraphPayload,
  KnowledgeRelation,
  RelatedKnowledgeBundle,
} from "./types"

type ProjectKnowledgeRow = Pick<
  Project,
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "tagline"
  | "impact"
  | "ai_summary"
  | "tech_stack"
  | "technologies"
  | "concepts"
  | "expertise_slugs"
  | "category"
  | "role"
  | "published_at"
  | "updated_at"
>

type ContentKnowledgeRow = Pick<
  Content,
  | "id"
  | "type"
  | "slug"
  | "title"
  | "excerpt"
  | "ai_summary"
  | "tags"
  | "concepts"
  | "expertise_slugs"
  | "published_at"
  | "updated_at"
>

async function buildKnowledgeGraphUncached(
  siteUrl: string
): Promise<KnowledgeGraphPayload | null> {
  const [
    { data: projects },
    { data: research },
    { data: writing },
    { data: automations },
    { data: expertiseAreas },
    { data: technologyRegistry },
    { data: conceptRegistry },
  ] = await Promise.all([
    getPublishedProjects(),
    getPublishedContent({ type: "research" }),
    getPublishedContent({ type: "blog" }),
    getPublishedContent({ type: "automation" }),
    getPublishedExpertiseAreas(),
    getPublishedTechnologyRegistry(),
    getPublishedConceptRegistry(),
  ])

  const registryBySlug = new Map(
    (technologyRegistry ?? []).map((item) => [normalizeTechnologySlug(item.slug), item])
  )
  const conceptRegistryBySlug = new Map(
    (conceptRegistry ?? []).map((item) => [normalizeConceptSlug(item.slug), item])
  )

  const projectRows = (projects ?? []) as unknown as ProjectKnowledgeRow[]
  const contentRows = [
    ...(research ?? []),
    ...(writing ?? []),
    ...(automations ?? []),
  ] as unknown as ContentKnowledgeRow[]

  const entities: KnowledgeEntity[] = []
  const relationships: KnowledgeRelation[] = []
  const technologySlugs = new Set<string>(registryBySlug.keys())
  const conceptSlugs = new Set<string>(conceptRegistryBySlug.keys())

  for (const area of expertiseAreas ?? []) {
    entities.push(expertiseToEntity(area, siteUrl))
    relationships.push(
      ...relationsForRelatedExpertiseLinks(area.slug, area.related_expertise_slugs ?? [])
    )
  }

  for (const project of projectRows) {
    const entity = projectToEntity(project, siteUrl)
    const meta = buildProjectEntityMetadata(project)
    const extracted = extractEntitiesFromProject(project)

    entities.push({
      ...entity,
      metadata: {
        expertiseSlugs: meta.expertiseSlugs,
        technologies: meta.technologies,
        concepts: meta.concepts,
      },
    })

    relationships.push(...relationsForExpertiseLinks(entity.id, meta.expertiseSlugs))
    relationships.push(...relationsForTechnologyLinks(entity.id, extracted.technologies))
    relationships.push(...relationsForConceptLinks(entity.id, extracted.concepts))

    for (const slug of extracted.technologies) {
      technologySlugs.add(slug)
    }
    for (const concept of extracted.concepts) {
      conceptSlugs.add(normalizeConceptSlug(concept))
    }
  }

  for (const item of contentRows) {
    const entity = contentToEntity(item, siteUrl)
    if (!entity) {
      continue
    }

    const meta = buildContentEntityMetadata(item)
    const extracted = extractEntitiesFromContent(item)

    entities.push({
      ...entity,
      metadata: {
        expertiseSlugs: meta.expertiseSlugs,
        technologies: meta.technologies,
        concepts: meta.concepts,
        tags: meta.tags,
      },
    })

    relationships.push(...relationsForExpertiseLinks(entity.id, meta.expertiseSlugs))
    relationships.push(...relationsForTechnologyLinks(entity.id, extracted.technologies))
    relationships.push(...relationsForConceptLinks(entity.id, extracted.concepts))

    for (const slug of extracted.technologies) {
      technologySlugs.add(slug)
    }
    for (const concept of extracted.concepts) {
      conceptSlugs.add(normalizeConceptSlug(concept))
    }
  }

  const stackNames = collectStackTechnologyNames({
    projects: projectRows,
    experience: [],
  })

  for (const name of stackNames) {
    technologySlugs.add(normalizeTechnologySlug(name))
  }

  const technologies = [...technologySlugs]
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => {
      const record = registryBySlug.get(slug)
      entities.push(
        technologyToEntity(slug, siteUrl, record ?? undefined)
      )
      return {
        slug,
        name: record?.title ?? technologyToEntity(slug, siteUrl).title,
        category: record?.category ?? null,
        registered: Boolean(record),
      }
    })

  const concepts = [...conceptSlugs]
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => {
      const record = conceptRegistryBySlug.get(slug)
      entities.push({
        ...conceptToEntity(record?.title ?? slug, siteUrl, record ?? undefined),
        metadata: {
          whyItMatters: record?.why_it_matters ?? null,
          registered: record ? "true" : "false",
          relatedExpertiseSlugs: record?.related_expertise_slugs ?? [],
        },
      })
      if (record?.related_concept_slugs?.length) {
        relationships.push(
          ...relationsForRelatedConceptLinks(slug, record.related_concept_slugs)
        )
      }
      return {
        slug,
        title: record?.title ?? slug,
        registered: Boolean(record),
      }
    })

  return {
    entities,
    relationships,
    expertise: expertiseAreas ?? [],
    technologies,
    concepts,
  }
}

function getCachedKnowledgeGraph(siteUrl: string) {
  return unstable_cache(
    () => buildKnowledgeGraphUncached(siteUrl),
    ["public-knowledge-graph", siteUrl],
    {
      tags: [
        PUBLIC_CACHE_TAGS.knowledgeGraph,
        PUBLIC_CACHE_TAGS.projects,
        PUBLIC_CACHE_TAGS.content,
        PUBLIC_CACHE_TAGS.expertise,
        PUBLIC_CACHE_TAGS.technology,
        PUBLIC_CACHE_TAGS.concept,
      ],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function buildKnowledgeGraph(
  siteUrlInput?: string | null
): Promise<KnowledgeGraphPayload | null> {
  const siteUrl = resolveSiteUrl(siteUrlInput)
  if (!siteUrl) {
    return null
  }

  return getCachedKnowledgeGraph(siteUrl)()
}

export function findRelatedKnowledge(
  graph: KnowledgeGraphPayload,
  source: {
    id: string
    expertiseSlugs?: string[]
    concepts?: string[]
    tags?: string[]
    technologySlugs?: string[]
  },
  limit = 4
): RelatedKnowledgeBundle {
  const byType = (type: KnowledgeEntity["type"]) =>
    graph.entities.filter((entity) => entity.type === type && entity.id !== source.id)

  function score(entity: KnowledgeEntity): number {
    if (entity.id === source.id) {
      return -1
    }

    const direct = graph.relationships.some(
      (rel) =>
        (rel.sourceId === source.id && rel.targetId === entity.id) ||
        (rel.targetId === source.id && rel.sourceId === entity.id)
    )
      ? RELATED_CONTENT_WEIGHTS.directGraphEdge
      : 0

    const entityExpertise = Array.isArray(entity.metadata?.expertiseSlugs)
      ? (entity.metadata.expertiseSlugs as string[])
      : []
    const entityTechnologies = Array.isArray(entity.metadata?.technologies)
      ? (entity.metadata.technologies as string[])
      : []
    const entityConcepts = Array.isArray(entity.metadata?.concepts)
      ? (entity.metadata.concepts as string[])
      : []
    const entityTags = Array.isArray(entity.metadata?.tags)
      ? (entity.metadata.tags as string[])
      : []

    return (
      direct +
      scoreWeightedOverlap(
        source.expertiseSlugs ?? [],
        entityExpertise,
        RELATED_CONTENT_WEIGHTS.expertise
      ) +
      scoreWeightedOverlap(
        source.technologySlugs ?? [],
        entityTechnologies,
        RELATED_CONTENT_WEIGHTS.technology
      ) +
      scoreWeightedOverlap(
        source.concepts ?? [],
        entityConcepts,
        RELATED_CONTENT_WEIGHTS.concept
      ) +
      scoreWeightedOverlap(source.tags ?? [], entityTags, RELATED_CONTENT_WEIGHTS.tag)
    )
  }

  function pick(type: KnowledgeEntity["type"]) {
    return byType(type)
      .map((entity) => ({ entity, score: score(entity) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.entity)
  }

  const expertiseEntities = (source.expertiseSlugs ?? [])
    .map((slug) => graph.entities.find((entity) => entity.id === `expertise:${slug}`))
    .filter(Boolean) as KnowledgeEntity[]

  const technologyEntities = (source.technologySlugs ?? [])
    .map((slug) => graph.entities.find((entity) => entity.id === `technology:${slug}`))
    .filter(Boolean) as KnowledgeEntity[]

  const conceptEntities = (source.concepts ?? [])
    .map((concept) =>
      graph.entities.find((entity) => entity.id === `concept:${normalizeConceptSlug(concept)}`)
    )
    .filter(Boolean) as KnowledgeEntity[]

  return {
    expertise: expertiseEntities,
    technologies: technologyEntities,
    concepts: conceptEntities,
    projects: pick("project"),
    research: pick("research"),
    writing: pick("writing"),
    automations: pick("automation"),
  }
}

export function getExpertiseBundle(
  graph: KnowledgeGraphPayload,
  expertiseSlug: string
): {
  area: KnowledgeGraphPayload["expertise"][number] | null
  relatedExpertise: KnowledgeEntity[]
  projects: KnowledgeEntity[]
  research: KnowledgeEntity[]
  writing: KnowledgeEntity[]
  automations: KnowledgeEntity[]
  technologies: KnowledgeEntity[]
} {
  const area = graph.expertise.find((item) => item.slug === expertiseSlug) ?? null
  const linkedIds = new Set(
    graph.relationships
      .filter(
        (rel) =>
          rel.type === "uses_expertise" && rel.targetId === `expertise:${expertiseSlug}`
      )
      .map((rel) => rel.sourceId)
  )

  const linked = graph.entities.filter((entity) => linkedIds.has(entity.id))

  const techSlugs = new Set<string>()
  for (const rel of graph.relationships) {
    if (linkedIds.has(rel.sourceId) && rel.type === "uses_technology") {
      techSlugs.add(rel.targetId.replace("technology:", ""))
    }
  }

  const relatedExpertise = (area?.related_expertise_slugs ?? [])
    .map((slug) => graph.entities.find((entity) => entity.id === `expertise:${slug}`))
    .filter(Boolean) as KnowledgeEntity[]

  return {
    area,
    relatedExpertise,
    projects: linked.filter((entity) => entity.type === "project"),
    research: linked.filter((entity) => entity.type === "research"),
    writing: linked.filter((entity) => entity.type === "writing"),
    automations: linked.filter((entity) => entity.type === "automation"),
    technologies: [...techSlugs]
      .map((slug) => graph.entities.find((entity) => entity.id === `technology:${slug}`))
      .filter(Boolean) as KnowledgeEntity[],
  }
}

export function getTechnologyBundle(
  graph: KnowledgeGraphPayload,
  technologySlug: string
): {
  technology: KnowledgeEntity | null
  projects: KnowledgeEntity[]
  research: KnowledgeEntity[]
  writing: KnowledgeEntity[]
  automations: KnowledgeEntity[]
} {
  const normalized = normalizeTechnologySlug(technologySlug)
  const technology =
    graph.entities.find((entity) => entity.id === `technology:${normalized}`) ?? null

  const linkedIds = new Set(
    graph.relationships
      .filter(
        (rel) => rel.type === "uses_technology" && rel.targetId === `technology:${normalized}`
      )
      .map((rel) => rel.sourceId)
  )

  const linked = graph.entities.filter((entity) => linkedIds.has(entity.id))

  return {
    technology,
    projects: linked.filter((entity) => entity.type === "project"),
    research: linked.filter((entity) => entity.type === "research"),
    writing: linked.filter((entity) => entity.type === "writing"),
    automations: linked.filter((entity) => entity.type === "automation"),
  }
}

export function getConceptBundle(
  graph: KnowledgeGraphPayload,
  conceptSlug: string
): {
  concept: KnowledgeEntity | null
  registry: KnowledgeGraphPayload["concepts"][number] | null
  relatedConcepts: KnowledgeEntity[]
  relatedExpertise: KnowledgeEntity[]
  projects: KnowledgeEntity[]
  research: KnowledgeEntity[]
  writing: KnowledgeEntity[]
  automations: KnowledgeEntity[]
} {
  const normalized = normalizeConceptSlug(conceptSlug)
  const concept =
    graph.entities.find((entity) => entity.id === `concept:${normalized}`) ?? null
  const registry = graph.concepts.find((item) => item.slug === normalized) ?? null

  const linkedIds = new Set(
    graph.relationships
      .filter(
        (rel) => rel.type === "mentions_concept" && rel.targetId === `concept:${normalized}`
      )
      .map((rel) => rel.sourceId)
  )

  const linked = graph.entities.filter((entity) => linkedIds.has(entity.id))

  const relatedConceptSlugs = graph.relationships
    .filter(
      (rel) =>
        rel.type === "related_to" &&
        (rel.sourceId === `concept:${normalized}` || rel.targetId === `concept:${normalized}`)
    )
    .map((rel) =>
      rel.sourceId === `concept:${normalized}`
        ? rel.targetId.replace("concept:", "")
        : rel.sourceId.replace("concept:", "")
    )

  const relatedConcepts = relatedConceptSlugs
    .map((slug) => graph.entities.find((entity) => entity.id === `concept:${slug}`))
    .filter(Boolean) as KnowledgeEntity[]

  const conceptRecord = graph.entities.find((entity) => entity.id === `concept:${normalized}`)
  const relatedExpertiseSlugs = Array.isArray(conceptRecord?.metadata?.relatedExpertiseSlugs)
    ? (conceptRecord.metadata.relatedExpertiseSlugs as string[])
    : []

  const linkedExpertise = graph.expertise
    .filter((item) =>
      graph.relationships.some(
        (rel) =>
          rel.type === "uses_expertise" &&
          linkedIds.has(rel.sourceId) &&
          rel.targetId === `expertise:${item.slug}`
      )
    )
    .map((item) => graph.entities.find((entity) => entity.id === `expertise:${item.slug}`))
    .filter(Boolean) as KnowledgeEntity[]

  const explicitExpertise = relatedExpertiseSlugs
    .map((slug) => graph.entities.find((entity) => entity.id === `expertise:${slug}`))
    .filter(Boolean) as KnowledgeEntity[]

  return {
    concept,
    registry,
    relatedConcepts,
    relatedExpertise: [...explicitExpertise, ...linkedExpertise].filter(
      (entity, index, list) => list.findIndex((item) => item.id === entity.id) === index
    ),
    projects: linked.filter((entity) => entity.type === "project"),
    research: linked.filter((entity) => entity.type === "research"),
    writing: linked.filter((entity) => entity.type === "writing"),
    automations: linked.filter((entity) => entity.type === "automation"),
  }
}

export function linkContentByExpertiseSlug<T extends { expertise_slugs?: string[] | null }>(
  items: T[],
  expertiseSlug: string
): T[] {
  return items.filter((item) => (item.expertise_slugs ?? []).includes(expertiseSlug))
}

export function linkProjectsByTechnology<T extends { tech_stack?: string[] | null; technologies?: string[] | null }>(
  items: T[],
  technologySlug: string
): T[] {
  const normalized = normalizeTechnologySlug(technologySlug)

  return items.filter((item) => {
    const stack = [...(item.tech_stack ?? []), ...(item.technologies ?? [])]
    return stack.some((tech) => normalizeTechnologySlug(tech) === normalized)
  })
}
