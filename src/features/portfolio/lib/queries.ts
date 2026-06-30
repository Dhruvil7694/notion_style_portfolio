import "server-only"

import { unstable_cache } from "next/cache"
import { cache } from "react"

import {
  type ContentDocument,
  extractProjectIds,
} from "@/features/content/lib/schema"
import { deserializeContent } from "@/features/content/lib/serializer"
import {
  contentCacheTag,
  projectCacheTag,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from "@/features/portfolio/lib/cache-tags"
import { createPublicReadClient } from "@/shared/lib/supabase/public-read"
import type {
  Content,
  Education,
  Experience,
  Project,
  Resume,
  Skill,
} from "@/shared/types/database.helpers"

import {
  DEFAULT_PUBLIC_SETTINGS,
  parsePublicSettings,
  type PublicSettings,
} from "./settings"

type PublishedProjectRow = Pick<
  Project,
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "tagline"
  | "category"
  | "role"
  | "challenge"
  | "solution"
  | "approach"
  | "impact"
  | "content"
  | "tech_stack"
  | "technologies"
  | "concepts"
  | "expertise_slugs"
  | "ai_summary"
  | "featured"
  | "status"
  | "published_at"
  | "updated_at"
  | "github_url"
  | "live_url"
  | "icon_name"
  | "cover_image"
  | "thumbnail"
  | "gallery"
  | "hover_preview_enabled"
>

type PublishedContentRow = Pick<
  Content,
  | "id"
  | "type"
  | "slug"
  | "title"
  | "excerpt"
  | "tags"
  | "concepts"
  | "expertise_slugs"
  | "ai_summary"
  | "published_at"
  | "updated_at"
>

function getPublicClient() {
  return createPublicReadClient()
}

async function fetchPublicSettings(): Promise<PublicSettings> {
  const supabase = getPublicClient()
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "site_settings",
      "social_links",
      "contact_info",
      "about_content",
    ])

  if (!data || data.length === 0) {
    return DEFAULT_PUBLIC_SETTINGS
  }

  return parsePublicSettings(data)
}

const getCachedPublicSettings = unstable_cache(
  fetchPublicSettings,
  ["public-settings"],
  {
    tags: [PUBLIC_CACHE_TAGS.settings],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export const getPublicSettings = cache(async () => getCachedPublicSettings())

async function fetchAllPublishedProjects() {
  const supabase = getPublicClient()

  const query = supabase
    .from("projects")
    .select(
      "id, slug, title, summary, tagline, category, role, challenge, solution, approach, impact, content, tech_stack, technologies, concepts, expertise_slugs, ai_summary, featured, status, published_at, updated_at, github_url, live_url, icon_name, cover_image, thumbnail, gallery, hover_preview_enabled"
    )
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })

  const { data, error } = await query

  if (error && /challenge|solution|impact|display_order/i.test(error.message)) {
    const fallback = await supabase
      .from("projects")
      .select(
        "id, slug, title, summary, tagline, category, role, content, tech_stack, technologies, concepts, expertise_slugs, ai_summary, featured, status, published_at, updated_at, github_url, live_url, icon_name, cover_image, thumbnail, gallery"
      )
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false })

    return {
      data: (fallback.data ?? []).map((project) => ({
        ...project,
        challenge: null,
        impact: null,
        solution: null,
        approach: null,
        icon_name: null,
        hover_preview_enabled: true,
      })) as PublishedProjectRow[],
      error: fallback.error,
    }
  }

  return { data: (data ?? []) as PublishedProjectRow[], error }
}

const getCachedAllPublishedProjects = unstable_cache(
  fetchAllPublishedProjects,
  ["public-projects-all"],
  {
    tags: [PUBLIC_CACHE_TAGS.projects],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getPublishedProjects(options?: {
  featured?: boolean
  limit?: number
}) {
  const result = await getCachedAllPublishedProjects()
  let rows = result.data ?? []

  if (options?.featured) {
    rows = rows.filter((project) => project.featured)
  }

  if (options?.limit) {
    rows = rows.slice(0, options.limit)
  }

  return { data: rows, error: result.error }
}

async function fetchProjectBySlug(slug: string) {
  const supabase = getPublicClient()
  return supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
}

function getCachedProjectBySlug(slug: string) {
  return unstable_cache(
    () => fetchProjectBySlug(slug),
    ["public-project-by-slug", slug],
    {
      tags: [PUBLIC_CACHE_TAGS.projects, projectCacheTag(slug)],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getProjectBySlug(slug: string) {
  return getCachedProjectBySlug(slug)()
}

export async function getRelatedProjects(
  currentId: string,
  techStack: string[] | null,
  limit = 3
) {
  const { data } = await getCachedAllPublishedProjects()
  const projects = (data ?? []).filter((project) => project.id !== currentId)

  if (!techStack || techStack.length === 0) {
    return projects.slice(0, limit)
  }

  const stackSet = new Set(techStack.map((item) => item.toLowerCase()))
  const scored = projects
    .map((project) => {
      const overlap =
        project.tech_stack?.filter((tech) => stackSet.has(tech.toLowerCase()))
          .length ?? 0
      return { project, overlap }
    })
    .sort((a, b) => b.overlap - a.overlap)

  return scored.slice(0, limit).map((item) => item.project)
}

async function fetchPublishedContentByType(type: Content["type"]) {
  const supabase = getPublicClient()

  const { data, error } = await supabase
    .from("content")
    .select(
      "id, type, slug, title, excerpt, tags, concepts, expertise_slugs, ai_summary, published_at, updated_at"
    )
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  return { data: (data ?? []) as PublishedContentRow[], error }
}

function getCachedPublishedContentByType(type: Content["type"]) {
  return unstable_cache(
    () => fetchPublishedContentByType(type),
    ["public-content-by-type", type],
    {
      tags: [PUBLIC_CACHE_TAGS.content, contentCacheTag(type)],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getPublishedContent(options: {
  type: Content["type"]
  limit?: number
}) {
  const { data, error } = await getCachedPublishedContentByType(options.type)()
  const rows = options.limit
    ? (data ?? []).slice(0, options.limit)
    : (data ?? [])

  return { data: rows, error }
}

async function fetchContentBySlug(type: Content["type"], slug: string) {
  const supabase = getPublicClient()
  return supabase
    .from("content")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
}

function getCachedContentBySlug(type: Content["type"], slug: string) {
  return unstable_cache(
    () => fetchContentBySlug(type, slug),
    ["public-content-by-slug", type, slug],
    {
      tags: [PUBLIC_CACHE_TAGS.content, contentCacheTag(type)],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getContentBySlug(type: Content["type"], slug: string) {
  return getCachedContentBySlug(type, slug)()
}

export async function getLatestPublishedContent(type: Content["type"]) {
  const { data } = await getCachedPublishedContentByType(type)()
  return (data?.[0] as Content | undefined) ?? null
}

async function fetchExperienceList() {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from("experience")
    .select("*")
    .order("display_order", { ascending: true })
    .order("start_date", { ascending: false })

  return { data: (data ?? []) as Experience[], error }
}

const getCachedExperienceList = unstable_cache(
  fetchExperienceList,
  ["public-experience-list"],
  {
    tags: [PUBLIC_CACHE_TAGS.experience],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getExperienceList() {
  return getCachedExperienceList()
}

async function fetchExperienceById(id: string) {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from("experience")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  return { data: (data as Experience | null) ?? null, error }
}

function getCachedExperienceById(id: string) {
  return unstable_cache(
    () => fetchExperienceById(id),
    ["public-experience-by-id", id],
    {
      tags: [PUBLIC_CACHE_TAGS.experience],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getExperienceById(id: string) {
  return getCachedExperienceById(id)()
}

async function fetchSkillsList() {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("display_order", { ascending: true })

  return { data: (data ?? []) as Skill[], error }
}

const getCachedSkillsList = unstable_cache(
  fetchSkillsList,
  ["public-skills-list"],
  {
    tags: [PUBLIC_CACHE_TAGS.skills],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getSkillsList() {
  return getCachedSkillsList()
}

async function fetchEducationList() {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from("education")
    .select("*")
    .order("start_date", { ascending: false })

  return { data: (data ?? []) as Education[], error }
}

const getCachedEducationList = unstable_cache(
  fetchEducationList,
  ["public-education-list"],
  {
    tags: [PUBLIC_CACHE_TAGS.education],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getEducationList() {
  return getCachedEducationList()
}

async function fetchActiveResume() {
  const supabase = getPublicClient()
  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("is_active", true)
    .maybeSingle()

  return data as Resume | null
}

const getCachedActiveResume = unstable_cache(
  fetchActiveResume,
  ["public-active-resume"],
  {
    tags: [PUBLIC_CACHE_TAGS.resume],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export const getActiveResume = cache(async () => getCachedActiveResume())

export async function getProjectPreviewsForDocument(
  document: ContentDocument
): Promise<
  Record<
    string,
    {
      id: string
      title: string
      summary: string
      tech_stack: string[] | null
      status: string
    }
  >
> {
  const projectIds = extractProjectIds(document)

  if (projectIds.length === 0) {
    return {}
  }

  const { data: allProjects } = await getCachedAllPublishedProjects()
  const idSet = new Set(projectIds)

  const map: Record<
    string,
    {
      id: string
      title: string
      summary: string
      tech_stack: string[] | null
      status: string
    }
  > = {}

  for (const project of allProjects ?? []) {
    if (idSet.has(project.id)) {
      map[project.id] = {
        id: project.id,
        title: project.title,
        summary: project.summary,
        tech_stack: project.tech_stack,
        status: project.status,
      }
    }
  }

  return map
}

export async function getProjectPreviewsForRawContent(raw: unknown) {
  const document = deserializeContent(raw)
  return getProjectPreviewsForDocument(document)
}

async function fetchPublishedExpertiseAreas() {
  const supabase = getPublicClient()

  const { data, error } = await supabase
    .from("expertise_areas")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })

  return { data: data ?? [], error }
}

const getCachedPublishedExpertiseAreas = unstable_cache(
  fetchPublishedExpertiseAreas,
  ["public-expertise-areas"],
  {
    tags: [PUBLIC_CACHE_TAGS.expertise],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getPublishedExpertiseAreas(options?: {
  featured?: boolean
}) {
  const { data, error } = await getCachedPublishedExpertiseAreas()

  if (options?.featured) {
    return {
      data: (data ?? []).filter((area) => area.featured),
      error,
    }
  }

  return { data: data ?? [], error }
}

async function fetchExpertiseAreaBySlug(slug: string) {
  const supabase = getPublicClient()
  return supabase
    .from("expertise_areas")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
}

function getCachedExpertiseAreaBySlug(slug: string) {
  return unstable_cache(
    () => fetchExpertiseAreaBySlug(slug),
    ["public-expertise-by-slug", slug],
    {
      tags: [PUBLIC_CACHE_TAGS.expertise],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getExpertiseAreaBySlug(slug: string) {
  return getCachedExpertiseAreaBySlug(slug)()
}

async function fetchPublishedTechnologyRegistry() {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from("technology_registry")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })

  return { data: data ?? [], error }
}

const getCachedPublishedTechnologyRegistry = unstable_cache(
  fetchPublishedTechnologyRegistry,
  ["public-technology-registry"],
  {
    tags: [PUBLIC_CACHE_TAGS.technology],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getPublishedTechnologyRegistry() {
  return getCachedPublishedTechnologyRegistry()
}

async function fetchTechnologyBySlug(slug: string) {
  const supabase = getPublicClient()
  return supabase
    .from("technology_registry")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
}

function getCachedTechnologyBySlug(slug: string) {
  return unstable_cache(
    () => fetchTechnologyBySlug(slug),
    ["public-technology-by-slug", slug],
    {
      tags: [PUBLIC_CACHE_TAGS.technology],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getTechnologyBySlug(slug: string) {
  return getCachedTechnologyBySlug(slug)()
}

async function fetchPublishedConceptRegistry() {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from("concept_registry")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })

  return { data: data ?? [], error }
}

const getCachedPublishedConceptRegistry = unstable_cache(
  fetchPublishedConceptRegistry,
  ["public-concept-registry"],
  {
    tags: [PUBLIC_CACHE_TAGS.concept],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  }
)

export async function getPublishedConceptRegistry() {
  return getCachedPublishedConceptRegistry()
}

async function fetchConceptBySlug(slug: string) {
  const supabase = getPublicClient()
  return supabase
    .from("concept_registry")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
}

function getCachedConceptBySlug(slug: string) {
  return unstable_cache(
    () => fetchConceptBySlug(slug),
    ["public-concept-by-slug", slug],
    {
      tags: [PUBLIC_CACHE_TAGS.concept],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    }
  )
}

export async function getConceptBySlug(slug: string) {
  return getCachedConceptBySlug(slug)()
}
