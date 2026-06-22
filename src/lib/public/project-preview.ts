import { formatDate } from "@/lib/utils/date"
import type { Project } from "@/types/database.helpers"

type ProjectPreviewFields = Pick<Project, "category" | "featured" | "published_at">

export function buildProjectMetadataLine(project: ProjectPreviewFields) {
  const year = project.published_at ? formatDate(project.published_at, "yyyy") : null
  const category = project.category?.trim() || null
  const status = project.featured ? "Production" : "Published"

  return [year, category, status].filter(Boolean).join(" · ")
}

export function buildProjectImpactLine(project: {
  impact?: string | null
  tagline?: string | null
  summary?: string | null
}): string | null {
  const impact = project.impact?.trim()
  if (impact) {
    return impact
  }

  const tagline = project.tagline?.trim()
  if (tagline) {
    return tagline
  }

  const summary = project.summary?.trim()
  return summary || null
}
