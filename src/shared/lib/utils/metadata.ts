import "server-only"

import type { Metadata } from "next"

import { DEFAULT_PUBLIC_SETTINGS } from "@/features/portfolio/lib/settings"
import { truncateDescription } from "@/features/seo/lib/description"
import { buildBaseMetadata } from "@/features/seo/lib/metadata"

type PageMetadataInput = {
  title: string
  description?: string
  path?: string
  siteName?: string
  siteUrl?: string
  noIndex?: boolean
}

/** Backward-compatible metadata helper for admin and legacy routes. */
export function createPageMetadata({
  title,
  description,
  path = "",
  siteName = "Portfolio",
  siteUrl,
  noIndex = false,
}: PageMetadataInput): Metadata {
  return buildBaseMetadata(
    {
      settings: {
        ...DEFAULT_PUBLIC_SETTINGS,
        site: {
          ...DEFAULT_PUBLIC_SETTINGS.site,
          site_name: siteName,
          ...(description ? { site_description: description } : {}),
        },
      },
      siteUrl,
    },
    {
      title,
      description,
      path,
      noIndex,
    }
  )
}

export function mergeMetadata(base: Metadata, override: Metadata): Metadata {
  return {
    ...base,
    ...override,
    openGraph: {
      ...base.openGraph,
      ...override.openGraph,
    },
    twitter: {
      ...base.twitter,
      ...override.twitter,
    },
  }
}

export { truncateDescription }
