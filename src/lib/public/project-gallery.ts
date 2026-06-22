import { z } from "zod"

export const PROJECT_GALLERY_TYPES = [
  "screenshot",
  "diagram",
  "workflow",
  "dashboard",
  "research",
  "demo",
  "layout",
] as const

export const projectGalleryTypeSchema = z.enum(PROJECT_GALLERY_TYPES)

export type ProjectGalleryType = z.infer<typeof projectGalleryTypeSchema>

export const projectGalleryItemSchema = z.object({
  url: z.string().trim().url("Must be a valid URL"),
  type: projectGalleryTypeSchema.default("screenshot"),
  caption: z.string().trim().optional().or(z.literal("")),
  alt: z.string().trim().optional().or(z.literal("")),
})

export type ProjectGalleryItem = z.infer<typeof projectGalleryItemSchema>

/** @deprecated Use ProjectGalleryItem */
export type ProjectDemoImage = Pick<ProjectGalleryItem, "url" | "caption" | "alt">

export const PROJECT_GALLERY_TYPE_LABELS: Record<ProjectGalleryType, string> = {
  screenshot: "Screenshot",
  diagram: "Diagram",
  workflow: "Workflow",
  dashboard: "Dashboard",
  research: "Research",
  demo: "Demo",
  layout: "Layout",
}

const WALKTHROUGH_TYPES: ProjectGalleryType[] = [
  "workflow",
  "dashboard",
  "demo",
  "screenshot",
  "layout",
  "research",
]

export function parseProjectGallery(
  galleryValue: unknown,
  legacyDemoImages?: unknown
): ProjectGalleryItem[] {
  if (Array.isArray(galleryValue) && galleryValue.length > 0) {
    return galleryValue.flatMap((entry) => {
      const parsed = projectGalleryItemSchema.safeParse(entry)
      return parsed.success ? [parsed.data] : []
    })
  }

  if (!Array.isArray(legacyDemoImages)) {
    return []
  }

  return legacyDemoImages.flatMap((entry) => {
    const legacy = z
      .object({
        url: z.string().trim().url(),
        caption: z.string().trim().optional().or(z.literal("")),
        alt: z.string().trim().optional().or(z.literal("")),
      })
      .safeParse(entry)

    return legacy.success
      ? [{ ...legacy.data, type: "screenshot" as const }]
      : []
  })
}

export function galleryItemsOfType(
  items: ProjectGalleryItem[],
  type: ProjectGalleryType
): ProjectGalleryItem[] {
  return items.filter((item) => item.type === type)
}

export function firstGalleryItemOfType(
  items: ProjectGalleryItem[],
  type: ProjectGalleryType
): ProjectGalleryItem | undefined {
  return galleryItemsOfType(items, type)[0]
}

export function walkthroughGalleryItems(items: ProjectGalleryItem[]): ProjectGalleryItem[] {
  const seen = new Set<string>()
  const ordered: ProjectGalleryItem[] = []

  for (const type of WALKTHROUGH_TYPES) {
    for (const item of galleryItemsOfType(items, type)) {
      if (!seen.has(item.url)) {
        seen.add(item.url)
        ordered.push(item)
      }
    }
  }

  return ordered
}

export function resolveProjectThumbnail(project: {
  thumbnail?: string | null
  cover_image?: string | null
}): string | null {
  return project.thumbnail?.trim() || project.cover_image?.trim() || null
}

export type VideoEmbed =
  | { kind: "youtube"; src: string }
  | { kind: "vimeo"; src: string }
  | { kind: "file"; src: string }

export function resolveVideoEmbed(url: string | null | undefined): VideoEmbed | null {
  const trimmed = url?.trim()
  if (!trimmed) {
    return null
  }

  const youtubeMatch =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/) ??
    trimmed.match(/^([\w-]{11})$/)
  if (youtubeMatch?.[1]) {
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`,
    }
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch?.[1]) {
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    }
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) {
    return { kind: "file", src: trimmed }
  }

  return null
}
