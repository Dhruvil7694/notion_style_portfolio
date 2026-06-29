import "server-only"

import type { Metadata } from "next"

import type { PublicSettings } from "@/features/portfolio/lib/settings"

import {
  generateCanonicalUrl,
  resolveCanonicalPath,
  resolveSiteUrl,
} from "./canonical"
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_SITE_TITLE,
  SEO_TITLE_TEMPLATE,
} from "./constants"
import { truncateDescription } from "./description"
import {
  buildOpenGraphImageDescriptor,
  buildOpenGraphImageUrl,
  resolveTwitterHandle,
} from "./opengraph"

export { truncateDescription } from "./description"

type MetadataContext = {
  settings: PublicSettings
  siteUrl?: string
}

type BaseMetadataInput = {
  title: string
  description?: string
  path?: string
  noIndex?: boolean
  keywords?: string[]
  ogType?: "website" | "article"
  publishedTime?: string | null
  modifiedTime?: string | null
  tags?: string[]
  imagePath?: string
  imageAlt?: string
}

function resolveContext(context: MetadataContext) {
  const siteUrl =
    context.siteUrl ?? resolveSiteUrl(context.settings.site.site_url)
  const siteName = context.settings.site.owner_name || SEO_SITE_TITLE
  const twitterCreator = resolveTwitterHandle(context.settings.social.twitter)

  return { siteUrl, siteName, twitterCreator }
}

export function buildSiteTitleConfig(): Metadata["title"] {
  return {
    default: SEO_SITE_TITLE,
    template: SEO_TITLE_TEMPLATE,
  }
}

export function buildAbsolutePageTitle(title: string): Metadata["title"] {
  return { absolute: title }
}

export function buildBaseMetadata(
  context: MetadataContext,
  input: BaseMetadataInput
): Metadata {
  const { siteUrl, siteName, twitterCreator } = resolveContext(context)
  const description = truncateDescription(
    input.description ?? SEO_DEFAULT_DESCRIPTION
  )
  const path = resolveCanonicalPath(input.path)
  const canonicalUrl = siteUrl ? generateCanonicalUrl(siteUrl, path) : undefined
  const title = input.title
  const keywords = input.keywords ?? [...SEO_KEYWORDS]

  const imagePath = input.imagePath ?? path
  const ogImage =
    siteUrl && imagePath
      ? buildOpenGraphImageDescriptor(
          siteUrl,
          imagePath,
          input.imageAlt ?? title
        )
      : undefined

  return {
    title,
    description,
    keywords,
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
    ...(canonicalUrl
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
          openGraph: {
            title,
            description,
            siteName,
            url: canonicalUrl,
            type: input.ogType ?? "website",
            ...(ogImage ? { images: [ogImage] } : {}),
            ...(input.publishedTime
              ? { publishedTime: input.publishedTime }
              : {}),
            ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
            ...(input.tags?.length ? { tags: input.tags } : {}),
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
            ...(ogImage ? { images: [ogImage.url] } : {}),
            ...(twitterCreator ? { creator: twitterCreator } : {}),
            site: siteName,
          },
        }
      : {}),
  }
}

export function buildHomeMetadata(context: MetadataContext): Metadata {
  const description =
    context.settings.site.site_description?.trim() || SEO_DEFAULT_DESCRIPTION
  const siteTitle = context.settings.site.owner_name?.trim() || SEO_SITE_TITLE

  return {
    ...buildBaseMetadata(context, {
      title: siteTitle,
      description,
      path: "/",
      imageAlt: `${SEO_SITE_TITLE} — Applied AI Engineer`,
    }),
    title: buildAbsolutePageTitle(siteTitle),
  }
}

export function buildProjectsIndexMetadata(context: MetadataContext): Metadata {
  return buildBaseMetadata(context, {
    title: "Projects",
    description: `Production AI systems, research platforms, and applied experiments by ${SEO_SITE_TITLE}.`,
    path: "/projects",
  })
}

export function buildProjectMetadata(
  context: MetadataContext,
  project: {
    title: string
    summary: string
    slug: string
    seo_title?: string | null
    seo_description?: string | null
    published_at?: string | null
    updated_at?: string
    tech_stack?: string[] | null
    category?: string | null
    role?: string | null
  }
): Metadata {
  const title = project.seo_title?.trim() || project.title
  const description = project.seo_description?.trim() || project.summary
  const keywords = [
    ...SEO_KEYWORDS,
    ...(project.tech_stack ?? []),
    project.category,
    project.role,
  ].filter(Boolean) as string[]

  return buildBaseMetadata(context, {
    title,
    description,
    path: `/projects/${project.slug}`,
    imagePath: `/projects/${project.slug}`,
    imageAlt: project.title,
    ogType: "article",
    publishedTime: project.published_at,
    modifiedTime: project.updated_at,
    tags: project.tech_stack ?? undefined,
    keywords,
  })
}

export function buildResearchIndexMetadata(context: MetadataContext): Metadata {
  return buildBaseMetadata(context, {
    title: "Research",
    description: `Applied AI research, papers, and technical notes by ${SEO_SITE_TITLE}.`,
    path: "/research",
  })
}

export function buildResearchMetadata(
  context: MetadataContext,
  item: {
    title: string
    excerpt?: string | null
    slug: string
    seo_title?: string | null
    seo_description?: string | null
    published_at?: string | null
    updated_at?: string
    tags?: string[] | null
  }
): Metadata {
  const title = item.seo_title?.trim() || item.title
  const description =
    item.seo_description?.trim() || item.excerpt || SEO_DEFAULT_DESCRIPTION

  return buildBaseMetadata(context, {
    title,
    description,
    path: `/research/${item.slug}`,
    imagePath: `/research/${item.slug}`,
    imageAlt: item.title,
    ogType: "article",
    publishedTime: item.published_at,
    modifiedTime: item.updated_at,
    tags: item.tags ?? undefined,
    keywords: [...SEO_KEYWORDS, ...(item.tags ?? [])],
  })
}

export function buildBlogIndexMetadata(context: MetadataContext): Metadata {
  return buildBaseMetadata(context, {
    title: "Writing",
    description: `Essays, notes, and technical writing by ${SEO_SITE_TITLE}.`,
    path: "/blog",
  })
}

export function buildBlogMetadata(
  context: MetadataContext,
  item: {
    title: string
    excerpt?: string | null
    slug: string
    seo_title?: string | null
    seo_description?: string | null
    published_at?: string | null
    updated_at?: string
    tags?: string[] | null
    content?: unknown
  }
): Metadata {
  const readingTime = estimateContentReadingTime(item)
  const baseDescription =
    item.seo_description?.trim() || item.excerpt || SEO_DEFAULT_DESCRIPTION
  const description = item.published_at
    ? `${baseDescription} ${readingTime}. Published ${formatIsoDate(item.published_at)}.`
    : `${baseDescription} ${readingTime}.`

  const title = item.seo_title?.trim() || item.title

  return buildBaseMetadata(context, {
    title,
    description,
    path: `/blog/${item.slug}`,
    imagePath: `/blog/${item.slug}`,
    imageAlt: item.title,
    ogType: "article",
    publishedTime: item.published_at,
    modifiedTime: item.updated_at,
    tags: item.tags ?? undefined,
    keywords: [...SEO_KEYWORDS, ...(item.tags ?? [])],
  })
}

export function buildAutomationsIndexMetadata(
  context: MetadataContext
): Metadata {
  return buildBaseMetadata(context, {
    title: "Automations",
    description: `Automation systems, workflows, and applied AI tooling by ${SEO_SITE_TITLE}.`,
    path: "/automations",
  })
}

export function buildAutomationMetadata(
  context: MetadataContext,
  item: {
    title: string
    excerpt?: string | null
    slug: string
    seo_title?: string | null
    seo_description?: string | null
    published_at?: string | null
    updated_at?: string
    tags?: string[] | null
  }
): Metadata {
  const title = item.seo_title?.trim() || item.title
  const description =
    item.seo_description?.trim() || item.excerpt || SEO_DEFAULT_DESCRIPTION

  return buildBaseMetadata(context, {
    title,
    description,
    path: `/automations/${item.slug}`,
    imagePath: `/automations/${item.slug}`,
    imageAlt: item.title,
    ogType: "article",
    publishedTime: item.published_at,
    modifiedTime: item.updated_at,
    tags: item.tags ?? undefined,
    keywords: [...SEO_KEYWORDS, ...(item.tags ?? [])],
  })
}

export function buildExperienceIndexMetadata(
  context: MetadataContext
): Metadata {
  return buildBaseMetadata(context, {
    title: "Experience",
    description: `Professional experience and engineering roles for ${SEO_SITE_TITLE}.`,
    path: "/experience",
  })
}

export function buildContactMetadata(context: MetadataContext): Metadata {
  return buildBaseMetadata(context, {
    title: "Contact",
    description: `Contact ${SEO_SITE_TITLE} for collaborations, consulting, and applied AI engineering work.`,
    path: "/contact",
  })
}

export function buildPrivacyMetadata(context: MetadataContext): Metadata {
  return buildBaseMetadata(context, {
    title: "Privacy Policy",
    description: `Privacy policy for ${SEO_SITE_TITLE}: analytics, error monitoring, AI assistant usage, and contact data.`,
    path: "/privacy",
  })
}

export function buildNotFoundMetadata(title = "Not Found"): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  }
}

export function buildMetadataBase(siteUrl: string): Metadata {
  return {
    metadataBase: new URL(`${siteUrl.replace(/\/$/, "")}/`),
  }
}

function formatIsoDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
}

function estimateContentReadingTime(item: {
  excerpt?: string | null
  content?: unknown
}): string {
  const plain = [item.excerpt, extractPlainTextFromContent(item.content)]
    .filter(Boolean)
    .join(" ")

  const words = plain.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))

  return `${minutes} min read`
}

function extractPlainTextFromContent(content: unknown): string {
  if (!content || typeof content !== "object") {
    return ""
  }

  try {
    const serialized = JSON.stringify(content)
    return serialized
      .replace(/[{}\[\]",:]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  } catch {
    return ""
  }
}

export function getDefaultOpenGraphImageUrl(siteUrl: string): string {
  return buildOpenGraphImageUrl(siteUrl, "/")
}
