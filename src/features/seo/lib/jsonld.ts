import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { SEO_SITE_TITLE } from "@/features/seo/lib/constants"
import type { Content, Project } from "@/shared/types/database.helpers"

import { generateCanonicalUrl } from "./canonical"

type JsonLdObject = Record<string, unknown>

function withContext(payload: JsonLdObject): JsonLdObject {
  return {
    "@context": "https://schema.org",
    ...payload,
  }
}

export function buildPersonJsonLd(
  settings: PublicSettings,
  siteUrl: string
): JsonLdObject {
  const sameAs = [
    settings.social.github,
    settings.social.linkedin,
    settings.social.twitter,
    settings.social.substack,
    settings.social.medium,
    settings.social.youtube,
    settings.social.bluesky,
  ].filter((value): value is string => Boolean(value?.trim()))

  return withContext({
    "@type": "Person",
    name: settings.site.owner_name || SEO_SITE_TITLE,
    jobTitle: settings.site.owner_title || "Applied AI Engineer",
    url: siteUrl,
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  })
}

export function buildWebsiteJsonLd(
  settings: PublicSettings,
  siteUrl: string
): JsonLdObject {
  const searchUrl = generateCanonicalUrl(siteUrl, "/search")

  return withContext({
    "@type": "WebSite",
    name: settings.site.site_name || SEO_SITE_TITLE,
    url: siteUrl,
    description: settings.site.site_description,
    author: {
      "@type": "Person",
      name: settings.site.owner_name || SEO_SITE_TITLE,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  })
}

export function buildOrganizationJsonLd(
  settings: PublicSettings,
  siteUrl: string
): JsonLdObject {
  const sameAs = [
    settings.social.github,
    settings.social.linkedin,
    settings.social.twitter,
    settings.social.substack,
    settings.social.medium,
    settings.social.youtube,
    settings.social.bluesky,
  ].filter((value): value is string => Boolean(value?.trim()))

  return withContext({
    "@type": "Organization",
    name: settings.site.owner_name || settings.site.site_name || SEO_SITE_TITLE,
    url: siteUrl,
    description: settings.site.site_description || undefined,
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  })
}

export function buildProjectJsonLd(
  project: Pick<
    Project,
    | "title"
    | "summary"
    | "slug"
    | "tech_stack"
    | "published_at"
    | "updated_at"
    | "category"
    | "role"
    | "cover_image"
  >,
  settings: PublicSettings,
  siteUrl: string
): JsonLdObject {
  const url = generateCanonicalUrl(siteUrl, `/projects/${project.slug}`)

  return withContext({
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url,
    datePublished: project.published_at ?? undefined,
    dateModified: project.updated_at,
    image: project.cover_image || `${url}/opengraph-image`,
    keywords: project.tech_stack?.join(", "),
    creator: {
      "@type": "Person",
      name: settings.site.owner_name || SEO_SITE_TITLE,
    },
    ...(project.category ? { genre: project.category } : {}),
    ...(project.role
      ? {
          author: {
            "@type": "Person",
            name: settings.site.owner_name || SEO_SITE_TITLE,
            jobTitle: project.role,
          },
        }
      : {}),
  })
}

export function buildArticleJsonLd(
  item: Pick<
    Content,
    "title" | "excerpt" | "slug" | "published_at" | "updated_at" | "tags"
  >,
  settings: PublicSettings,
  siteUrl: string,
  section: "Research" | "Writing" | "Automation"
): JsonLdObject {
  const path =
    section === "Research"
      ? `/research/${item.slug}`
      : section === "Writing"
        ? `/blog/${item.slug}`
        : `/automations/${item.slug}`

  const url = generateCanonicalUrl(siteUrl, path)

  return withContext({
    "@type": "Article",
    headline: item.title,
    description: item.excerpt ?? undefined,
    url,
    datePublished: item.published_at ?? undefined,
    dateModified: item.updated_at,
    author: {
      "@type": "Person",
      name: settings.site.owner_name || SEO_SITE_TITLE,
    },
    publisher: {
      "@type": "Person",
      name: settings.site.owner_name || SEO_SITE_TITLE,
    },
    articleSection: section,
    ...(item.tags?.length ? { keywords: item.tags.join(", ") } : {}),
    image: `${url}/opengraph-image`,
  })
}

export function buildTechArticleJsonLd(
  item: Pick<
    Content,
    | "title"
    | "excerpt"
    | "slug"
    | "published_at"
    | "updated_at"
    | "tags"
    | "ai_summary"
  >,
  settings: PublicSettings,
  siteUrl: string
): JsonLdObject {
  const url = generateCanonicalUrl(siteUrl, `/research/${item.slug}`)

  return withContext({
    "@type": "TechArticle",
    headline: item.title,
    description: item.ai_summary ?? item.excerpt ?? undefined,
    url,
    datePublished: item.published_at ?? undefined,
    dateModified: item.updated_at,
    author: {
      "@type": "Person",
      name: settings.site.owner_name || SEO_SITE_TITLE,
    },
    publisher: {
      "@type": "Person",
      name: settings.site.owner_name || SEO_SITE_TITLE,
    },
    ...(item.tags?.length ? { keywords: item.tags.join(", ") } : {}),
    image: `${url}/opengraph-image`,
  })
}

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[]
): JsonLdObject {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  })
}

export function buildProjectBreadcrumbJsonLd(
  projectTitle: string,
  projectSlug: string,
  siteUrl: string,
  currentPageLabel?: string
): JsonLdObject {
  const crumbs = [
    { name: "Home", url: siteUrl },
    { name: "Projects", url: generateCanonicalUrl(siteUrl, "/projects") },
    {
      name: projectTitle,
      url: generateCanonicalUrl(siteUrl, `/projects/${projectSlug}`),
    },
  ]

  if (currentPageLabel) {
    crumbs.push({
      name: currentPageLabel,
      url: generateCanonicalUrl(siteUrl, `/projects/${projectSlug}/faq`),
    })
  }

  return buildBreadcrumbJsonLd(crumbs)
}

export function buildContentBreadcrumbJsonLd(
  section: "Research" | "Writing" | "Automations",
  itemTitle: string,
  itemPath: string,
  siteUrl: string
): JsonLdObject {
  const sectionPath =
    section === "Research"
      ? "/research"
      : section === "Writing"
        ? "/blog"
        : "/automations"

  return buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: section, url: generateCanonicalUrl(siteUrl, sectionPath) },
    { name: itemTitle, url: generateCanonicalUrl(siteUrl, itemPath) },
  ])
}

export function mergeJsonLdGraph(schemas: JsonLdObject[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": schemas.map(stripJsonLdContext),
  }
}

export function buildFaqPageJsonLd(
  items: { question: string; answer: string }[],
  pageUrl: string
): JsonLdObject | null {
  if (items.length === 0) {
    return null
  }

  return withContext({
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: pageUrl,
  })
}

export function buildDefinedTermJsonLd(
  area: {
    title: string
    slug: string
    description?: string | null
    summary?: string | null
  },
  siteUrl: string,
  pathPrefix: "expertise" | "concept" = "expertise"
): JsonLdObject {
  return withContext({
    "@type": "DefinedTerm",
    name: area.title,
    description: area.summary ?? area.description ?? undefined,
    url: generateCanonicalUrl(siteUrl, `/${pathPrefix}/${area.slug}`),
  })
}

export function buildCollectionPageJsonLd(
  name: string,
  description: string | null | undefined,
  path: string,
  siteUrl: string
): JsonLdObject {
  return withContext({
    "@type": "CollectionPage",
    name,
    description: description ?? undefined,
    url: generateCanonicalUrl(siteUrl, path),
  })
}

export function buildItemListJsonLd(
  name: string,
  items: { name: string; url: string }[]
): JsonLdObject | null {
  if (items.length === 0) {
    return null
  }

  return withContext({
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  })
}

function stripJsonLdContext(schema: JsonLdObject): JsonLdObject {
  const copy = { ...schema }
  delete copy["@context"]
  return copy
}
