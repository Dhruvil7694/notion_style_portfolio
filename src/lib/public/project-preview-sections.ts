import type { Project } from "@/types/database.helpers"

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

function normalizePreviewValue(value: string | string[] | null | undefined): string | null {
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
    const primary = key === "approach_fallback" ? null : normalizePreviewValue(project[key])
    const fallback = fallbackKey ? normalizePreviewValue(project[fallbackKey]) : null
    const value = primary || fallback
    return value ? [{ label, value }] : []
  })
}

export function hasProjectPreview(project: ProjectPreviewFields): boolean {
  return getProjectPreviewSections(project).length > 0
}
