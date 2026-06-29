import { z } from "zod"

export const projectChallengeSchema = z.object({
  challenge: z.string().trim().min(1, "Challenge is required"),
  solution: z.string().trim().min(1, "Solution is required"),
})

export type ProjectChallenge = z.infer<typeof projectChallengeSchema>

export const projectFlowNodeSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
})

export type ProjectFlowNode = z.infer<typeof projectFlowNodeSchema>

export const projectMetricSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  value: z.string().trim().min(1, "Value is required"),
})

export type ProjectMetric = z.infer<typeof projectMetricSchema>

import {
  parseTradeoffItems,
  type ProjectTradeoffV2,
} from "@/features/knowledge-base/lib/schemas"

export const projectTradeoffSchema = z.object({
  decision: z.string().trim().min(1, "Decision is required"),
  alternative: z.string().trim().optional().or(z.literal("")),
  reason: z.string().trim().optional().or(z.literal("")),
  tradeoff: z.string().trim().optional().or(z.literal("")),
})

export type ProjectTradeoff = ProjectTradeoffV2

export const projectTechStackGroupSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  items: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((items) => items.filter(Boolean)),
})

export type ProjectTechStackGroup = z.infer<typeof projectTechStackGroupSchema>

export const projectTimelineEntrySchema = z.object({
  period: z.string().trim().min(1, "Period is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().or(z.literal("")),
})

export type ProjectTimelineEntry = z.infer<typeof projectTimelineEntrySchema>

export const projectDemoImageSchema = z.object({
  url: z.string().trim().url("Must be a valid URL"),
  caption: z.string().trim().optional().or(z.literal("")),
  alt: z.string().trim().optional().or(z.literal("")),
})

export type ProjectDemoImage = z.infer<typeof projectDemoImageSchema>

export {
  firstGalleryItemOfType,
  galleryItemsOfType,
  parseProjectGallery,
  PROJECT_GALLERY_TYPE_LABELS,
  PROJECT_GALLERY_TYPES,
  type ProjectGalleryItem,
  projectGalleryItemSchema,
  type ProjectGalleryType,
  projectGalleryTypeSchema,
  resolveProjectThumbnail,
  resolveVideoEmbed,
  walkthroughGalleryItems,
} from "@/features/portfolio/lib/project-gallery"

function parseLineList(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return []
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractMermaidLabels(source: string): string[] {
  const labels: string[] = []
  const pattern = /\["([^"\\]*)"\\]/g
  let match = pattern.exec(source)

  while (match) {
    const label = match[1]?.trim()
    if (label) {
      labels.push(label)
    }
    match = pattern.exec(source)
  }

  return labels
}

function parseDiagramText(value: string): ProjectFlowNode[] {
  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  if (/^(flowchart|graph)\s/im.test(trimmed)) {
    return extractMermaidLabels(trimmed).map((label) => ({ label }))
  }

  return parseLineList(trimmed).map((label) => ({ label }))
}

/** Accepts text[] from DB or legacy newline-separated text. */
export function parseStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return parseLineList(value)
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
}

/** Accepts jsonb node arrays or legacy text / Mermaid diagram strings. */
export function parseFlowNodes(value: unknown): ProjectFlowNode[] {
  if (typeof value === "string") {
    return parseDiagramText(value)
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = projectFlowNodeSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseProjectMetrics(value: unknown): ProjectMetric[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = projectMetricSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseProjectTradeoffs(value: unknown): ProjectTradeoff[] {
  return parseTradeoffItems(value)
}

export function parseTechStackGroups(value: unknown): ProjectTechStackGroup[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = projectTechStackGroupSchema.safeParse(entry)
    return parsed.success && parsed.data.items.length > 0 ? [parsed.data] : []
  })
}

export function parseProjectTimeline(value: unknown): ProjectTimelineEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = projectTimelineEntrySchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseDemoImages(value: unknown): ProjectDemoImage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = projectDemoImageSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function flattenTechStackGroups(
  groups: ProjectTechStackGroup[]
): string[] {
  const seen = new Set<string>()
  const items: string[] = []

  for (const group of groups) {
    for (const item of group.items) {
      const key = item.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    }
  }

  return items
}

export function formatLineList(items: string[]): string {
  return items.join("\n")
}

export function parseProjectChallenges(value: unknown): ProjectChallenge[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = projectChallengeSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function buildProjectDetailMetadataLine(project: {
  published_at: string | null
  year: string | null
  category: string | null
  role: string | null
  featured: boolean
}) {
  const monthYear = project.published_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(project.published_at))
    : project.year

  const status = project.featured ? "Production" : "Published"

  return [monthYear, project.category, status, project.role]
    .filter(Boolean)
    .join(" · ")
}

export function hasRichContent(content: unknown): boolean {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return false
  }

  const blocks = (content as { blocks?: unknown }).blocks
  return Array.isArray(blocks) && blocks.length > 0
}

export function resolveTechStackDisplay(
  groups: ProjectTechStackGroup[],
  fallback: string[]
): ProjectTechStackGroup[] {
  if (groups.length > 0) {
    return groups
  }

  if (fallback.length === 0) {
    return []
  }

  return [{ category: "Stack", items: fallback }]
}
