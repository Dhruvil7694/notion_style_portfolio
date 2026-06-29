import type { ContentStatus } from "@/shared/lib/constants"

export type { ContentStatus }

export type Timestamps = {
  created_at: string
  updated_at: string
}

export type Publishable = Timestamps & {
  status: ContentStatus
  published_at: string | null
}

export type Slugged = {
  slug: string
  title: string
}

export type MediaRef = {
  url: string
  alt: string
  width?: number
  height?: number
  mime_type?: string
}

export type JsonMetadata = Record<string, unknown>
