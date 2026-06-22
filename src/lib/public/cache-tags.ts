export const PUBLIC_CACHE_TAGS = {
  settings: "public-settings",
  resume: "public-resume",
  projects: "public-projects",
  experience: "public-experience",
  skills: "public-skills",
  education: "public-education",
  content: "public-content",
  expertise: "public-expertise",
  technology: "public-technology",
  concept: "public-concept",
  knowledgeGraph: "public-knowledge-graph",
  discovery: "public-discovery",
} as const

export type PublicCacheTag = (typeof PUBLIC_CACHE_TAGS)[keyof typeof PUBLIC_CACHE_TAGS]

/** Fallback TTL when admin has not triggered tag revalidation. */
export const PUBLIC_CACHE_REVALIDATE_SECONDS = 3600

export function contentCacheTag(type: string) {
  return `${PUBLIC_CACHE_TAGS.content}:${type}`
}

export function projectCacheTag(slug: string) {
  return `${PUBLIC_CACHE_TAGS.projects}:${slug}`
}
