export const APP_NAME = "AI Engineer Portfolio"

export const CONTENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS]

export const SLUG_MAX_LENGTH = 200

export const EXCERPT_MAX_LENGTH = 500

export const DESCRIPTION_MAX_LENGTH = 160

export const DEFAULT_PAGE_SIZE = 12

export const REVALIDATION_TAGS = {
  projects: "projects",
  blogs: "blogs",
  research: "research",
  automation: "automation",
  experience: "experience",
  settings: "settings",
} as const
