import { generateCanonicalUrl } from "@/lib/seo/canonical"
import type { Content, Project } from "@/types/database.helpers"

import { extractEntitiesFromContent, extractEntitiesFromProject } from "./entity-extractor"
import { normalizeTechnologySlug, resolveTechnologyLabel } from "./taxonomy"
import type { ExpertiseAreaRecord, KnowledgeEntity } from "./types"

export function projectToEntity(
  project: Pick<Project, "id" | "slug" | "title" | "summary" | "published_at" | "updated_at">,
  siteUrl: string
): KnowledgeEntity {
  return {
    id: `project:${project.id}`,
    type: "project",
    slug: project.slug,
    title: project.title,
    description: project.summary,
    url: generateCanonicalUrl(siteUrl, `/projects/${project.slug}`),
    publishedAt: project.published_at,
    updatedAt: project.updated_at,
  }
}

export function contentToEntity(
  item: Pick<Content, "id" | "type" | "slug" | "title" | "excerpt" | "published_at" | "updated_at">,
  siteUrl: string
): KnowledgeEntity | null {
  const path =
    item.type === "research"
      ? `/research/${item.slug}`
      : item.type === "blog"
        ? `/blog/${item.slug}`
        : item.type === "automation"
          ? `/automations/${item.slug}`
          : null

  if (!path) {
    return null
  }

  const type =
    item.type === "research"
      ? "research"
      : item.type === "blog"
        ? "writing"
        : "automation"

  return {
    id: `${type}:${item.id}`,
    type,
    slug: item.slug,
    title: item.title,
    description: item.excerpt,
    url: generateCanonicalUrl(siteUrl, path),
    publishedAt: item.published_at,
    updatedAt: item.updated_at,
  }
}

export function expertiseToEntity(
  area: ExpertiseAreaRecord,
  siteUrl: string
): KnowledgeEntity {
  return {
    id: `expertise:${area.slug}`,
    type: "expertise",
    slug: area.slug,
    title: area.title,
    description: area.summary ?? area.description,
    url: generateCanonicalUrl(siteUrl, `/expertise/${area.slug}`),
    metadata: {
      keywords: area.keywords,
      relatedExpertiseSlugs: area.related_expertise_slugs ?? [],
    },
  }
}

export function technologyToEntity(
  slug: string,
  siteUrl: string,
  record?: {
    title?: string
    description?: string | null
    summary?: string | null
    category?: string | null
    website_url?: string | null
    documentation_url?: string | null
  }
): KnowledgeEntity {
  const normalized = normalizeTechnologySlug(slug)
  const label = record?.title ?? resolveTechnologyLabel(normalized)

  return {
    id: `technology:${normalized}`,
    type: "technology",
    slug: normalized,
    title: label,
    description: record?.summary ?? record?.description ?? null,
    url: generateCanonicalUrl(siteUrl, `/technology/${normalized}`),
    metadata: {
      category: record?.category ?? null,
      websiteUrl: record?.website_url ?? null,
      documentationUrl: record?.documentation_url ?? null,
      registered: record ? "true" : "false",
    },
  }
}

export function conceptToEntity(
  concept: string,
  siteUrl: string,
  record?: {
    title?: string
    description?: string | null
    summary?: string | null
    why_it_matters?: string | null
  }
): KnowledgeEntity {
  const slug = normalizeTechnologySlug(concept)

  return {
    id: `concept:${slug}`,
    type: "concept",
    slug,
    title: record?.title ?? concept,
    description: record?.summary ?? record?.description ?? null,
    url: generateCanonicalUrl(siteUrl, `/concept/${slug}`),
    metadata: {
      whyItMatters: record?.why_it_matters ?? null,
      registered: record ? "true" : "false",
    },
  }
}

export function buildProjectEntityMetadata(
  project: Pick<
    Project,
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
    | "title"
  >
) {
  const extracted = extractEntitiesFromProject(project)

  return {
    expertiseSlugs: project.expertise_slugs ?? [],
    technologies: extracted.technologies,
    concepts: extracted.concepts,
    category: project.category,
    role: project.role,
  }
}

export function buildContentEntityMetadata(
  item: Pick<Content, "excerpt" | "ai_summary" | "tags" | "concepts" | "expertise_slugs" | "title">
) {
  const extracted = extractEntitiesFromContent(item)

  return {
    expertiseSlugs: item.expertise_slugs ?? [],
    concepts: extracted.concepts,
    technologies: extracted.technologies,
    tags: item.tags ?? [],
  }
}
