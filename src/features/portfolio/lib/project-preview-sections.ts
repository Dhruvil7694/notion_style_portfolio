import type { Project } from "@/shared/types/database.helpers"

import { resolveProjectThumbnail } from "./project-gallery"

export type ProjectPreviewFields = Pick<
  Project,
  "challenge" | "solution" | "approach" | "impact"
>

export type ProjectListPreviewItem = Pick<
  Project,
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
  | "tech_stack"
  | "featured"
  | "published_at"
  | "icon_name"
  | "cover_image"
  | "thumbnail"
  | "gallery"
>

export type ProjectPreviewSection = {
  label: "Challenge" | "Approach" | "Impact"
  value: string
}

const PREVIEW_SECTIONS: {
  key: keyof ProjectPreviewFields | "approach_fallback"
  label: ProjectPreviewSection["label"]
  fallbackKey?: keyof ProjectPreviewFields
}[] = [
  { key: "challenge", label: "Challenge" },
  { key: "approach", label: "Approach", fallbackKey: "solution" },
  { key: "impact", label: "Impact" },
]

function normalizePreviewValue(
  value: string | string[] | null | undefined
): string | null {
  if (Array.isArray(value)) {
    const items = value.map((entry) => entry.trim()).filter(Boolean)
    return items.length > 0 ? items.join(" → ") : null
  }

  const trimmed = value?.trim()
  return trimmed || null
}

export function getProjectPreviewSections(
  project: ProjectPreviewFields
): ProjectPreviewSection[] {
  return PREVIEW_SECTIONS.flatMap(({ key, label, fallbackKey }) => {
    const primary =
      key === "approach_fallback" ? null : normalizePreviewValue(project[key])
    const fallback = fallbackKey
      ? normalizePreviewValue(project[fallbackKey])
      : null
    const value = primary || fallback
    return value ? [{ label, value }] : []
  })
}

export function hasProjectPreview(project: ProjectPreviewFields): boolean {
  return getProjectPreviewSections(project).length > 0
}

const PREVIEW_BLURB_MAX = 88

function shortenPreviewText(value: string, max = PREVIEW_BLURB_MAX): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) {
    return trimmed
  }

  const slice = trimmed.slice(0, max)
  const lastSpace = slice.lastIndexOf(" ")

  return `${(lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`
}

export function getProjectPreviewImage(
  project: Pick<ProjectListPreviewItem, "cover_image" | "thumbnail" | "gallery">
): string | null {
  const direct = resolveProjectThumbnail(project)
  if (direct) {
    return direct
  }

  if (!Array.isArray(project.gallery)) {
    return null
  }

  for (const entry of project.gallery) {
    if (
      entry &&
      typeof entry === "object" &&
      "url" in entry &&
      typeof entry.url === "string" &&
      entry.url.trim()
    ) {
      return entry.url.trim()
    }
  }

  return null
}

export function getProjectPreviewBlurbs(
  project: ProjectPreviewFields
): ProjectPreviewSection[] {
  return getProjectPreviewSections(project).map((section) => ({
    ...section,
    value: shortenPreviewText(section.value),
  }))
}

const PREVIEW_DESCRIPTION_MAX = 110

export function getProjectPreviewDescription(
  project: Pick<
    ProjectListPreviewItem,
    "summary" | "tagline" | "impact" | "challenge" | "approach" | "solution"
  >
): string | null {
  const candidates = [
    project.summary,
    project.tagline,
    project.impact,
    project.challenge,
    project.approach,
    project.solution,
  ]

  for (const candidate of candidates) {
    const normalized = normalizePreviewValue(candidate)
    if (normalized) {
      return shortenPreviewText(normalized, PREVIEW_DESCRIPTION_MAX)
    }
  }

  return null
}
