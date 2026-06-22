import "server-only"

import type { MetadataRoute } from "next"

import { buildKnowledgeGraph } from "@/lib/knowledge/graph"
import { getPublicSettings, getPublishedContent, getPublishedExpertiseAreas, getPublishedProjects } from "@/lib/public/queries"
import { generateCanonicalUrl, resolveSiteUrl } from "@/lib/seo/canonical"

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/projects", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/expertise", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/technology", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/concept", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/explore", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/search", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/research", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/automations", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/ai-first", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/experience", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
  { path: "/resume", changeFrequency: "monthly" as const, priority: 0.6 },
]

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    return []
  }

  const [{ data: projects }, { data: research }, { data: writing }, { data: automations }, { data: expertiseAreas }] =
    await Promise.all([
      getPublishedProjects(),
      getPublishedContent({ type: "research" }),
      getPublishedContent({ type: "blog" }),
      getPublishedContent({ type: "automation" }),
      getPublishedExpertiseAreas(),
    ])

  const graph = await buildKnowledgeGraph(siteUrl)

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: generateCanonicalUrl(siteUrl, route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const projectEntries: MetadataRoute.Sitemap = (projects ?? []).map((project) => ({
    url: generateCanonicalUrl(siteUrl, `/projects/${project.slug}`),
    lastModified: project.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.85,
  }))

  const researchEntries: MetadataRoute.Sitemap = (research ?? []).map((item) => ({
    url: generateCanonicalUrl(siteUrl, `/research/${item.slug}`),
    lastModified: item.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.75,
  }))

  const writingEntries: MetadataRoute.Sitemap = (writing ?? []).map((item) => ({
    url: generateCanonicalUrl(siteUrl, `/blog/${item.slug}`),
    lastModified: item.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.75,
  }))

  const automationEntries: MetadataRoute.Sitemap = (automations ?? []).map((item) => ({
    url: generateCanonicalUrl(siteUrl, `/automations/${item.slug}`),
    lastModified: item.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.75,
  }))

  const expertiseEntries: MetadataRoute.Sitemap = (expertiseAreas ?? []).map((area) => ({
    url: generateCanonicalUrl(siteUrl, `/expertise/${area.slug}`),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const technologyEntries: MetadataRoute.Sitemap = (graph?.technologies ?? []).map((tech) => ({
    url: generateCanonicalUrl(siteUrl, `/technology/${tech.slug}`),
    changeFrequency: "monthly",
    priority: tech.registered ? 0.75 : 0.7,
  }))

  const conceptEntries: MetadataRoute.Sitemap = (graph?.concepts ?? []).map((concept) => ({
    url: generateCanonicalUrl(siteUrl, `/concept/${concept.slug}`),
    changeFrequency: "monthly",
    priority: concept.registered ? 0.8 : 0.65,
  }))

  return [
    ...staticEntries,
    ...projectEntries,
    ...researchEntries,
    ...writingEntries,
    ...automationEntries,
    ...expertiseEntries,
    ...technologyEntries,
    ...conceptEntries,
  ]
}

export function buildSitemapUrl(siteUrl: string): string {
  return generateCanonicalUrl(siteUrl, "/sitemap.xml")
}
