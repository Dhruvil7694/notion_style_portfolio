import "server-only"

import {
  extractEntitiesFromContent,
  extractEntitiesFromProject,
} from "@/features/knowledge-base/lib/entity-extractor"
import {
  generateCanonicalUrl,
  resolveSiteUrl,
} from "@/features/seo/lib/canonical"
import type { Content, Project } from "@/shared/types/database.helpers"

export type SearchDocumentType =
  | "project"
  | "research"
  | "writing"
  | "automation"

export type SearchDocument = {
  id: string
  type: SearchDocumentType
  title: string
  slug: string
  description: string
  url: string
  publishedAt?: string | null
  updatedAt?: string | null
  keywords: string[]
  category?: string | null
  role?: string | null
  readingTime?: string | null
  topics?: string[]
  techStack?: string[]
  expertise?: string[]
  technologies?: string[]
  concepts?: string[]
  entities?: string[]
  status: "published"
  /** Reserved for future vector search metadata */
  embeddingVersion?: null
}

function buildUrl(siteUrl: string, path: string): string {
  return generateCanonicalUrl(siteUrl, path)
}

export function projectToSearchDocument(
  project: Pick<
    Project,
    | "id"
    | "slug"
    | "title"
    | "summary"
    | "tagline"
    | "impact"
    | "category"
    | "role"
    | "tech_stack"
    | "technologies"
    | "concepts"
    | "expertise_slugs"
    | "ai_summary"
    | "published_at"
    | "updated_at"
  >,
  siteUrl: string
): SearchDocument {
  const extracted = extractEntitiesFromProject(project)

  return {
    id: project.id,
    type: "project",
    title: project.title,
    slug: project.slug,
    description: project.ai_summary ?? project.summary,
    url: buildUrl(siteUrl, `/projects/${project.slug}`),
    publishedAt: project.published_at,
    updatedAt: project.updated_at,
    keywords: [
      project.title,
      project.category,
      project.role,
      ...(project.tech_stack ?? []),
      ...(project.expertise_slugs ?? []),
      ...(project.concepts ?? []),
    ].filter(Boolean) as string[],
    category: project.category,
    role: project.role,
    techStack: project.tech_stack ?? [],
    expertise: project.expertise_slugs ?? [],
    technologies: extracted.technologies,
    concepts: extracted.concepts,
    entities: [...extracted.technologies, ...extracted.concepts],
    status: "published",
    embeddingVersion: null,
  }
}

function mapContentType(type: Content["type"]): SearchDocumentType | null {
  if (type === "research") {
    return "research"
  }

  if (type === "blog") {
    return "writing"
  }

  if (type === "automation") {
    return "automation"
  }

  return null
}

export function contentToSearchDocument(
  item: Pick<
    Content,
    | "id"
    | "slug"
    | "title"
    | "excerpt"
    | "tags"
    | "concepts"
    | "expertise_slugs"
    | "ai_summary"
    | "published_at"
    | "updated_at"
    | "type"
  >,
  siteUrl: string
): SearchDocument | null {
  const type = mapContentType(item.type)
  if (!type) {
    return null
  }

  const path =
    item.type === "research"
      ? `/research/${item.slug}`
      : item.type === "blog"
        ? `/blog/${item.slug}`
        : `/automations/${item.slug}`

  const extracted = extractEntitiesFromContent(item)

  return {
    id: item.id,
    type,
    title: item.title,
    slug: item.slug,
    description: item.ai_summary ?? item.excerpt ?? "",
    url: buildUrl(siteUrl, path),
    publishedAt: item.published_at,
    updatedAt: item.updated_at,
    keywords: [
      item.title,
      ...(item.tags ?? []),
      ...(item.expertise_slugs ?? []),
      ...(item.concepts ?? []),
    ],
    topics: item.tags ?? [],
    expertise: item.expertise_slugs ?? [],
    technologies: extracted.technologies,
    concepts: extracted.concepts,
    entities: [...extracted.technologies, ...extracted.concepts],
    status: "published",
    embeddingVersion: null,
  }
}

export async function buildSearchIndex(
  projects: Parameters<typeof projectToSearchDocument>[0][],
  content: Parameters<typeof contentToSearchDocument>[0][],
  siteUrlInput?: string | null
): Promise<SearchDocument[]> {
  const siteUrl = resolveSiteUrl(siteUrlInput)
  if (!siteUrl) {
    return []
  }

  const projectDocuments = projects.map((project) =>
    projectToSearchDocument(project, siteUrl)
  )
  const contentDocuments = content
    .map((item) => contentToSearchDocument(item, siteUrl))
    .filter((item): item is SearchDocument => item !== null)

  return [...projectDocuments, ...contentDocuments]
}
