import { notFound } from "next/navigation"

import { ProjectCaseStudy } from "@/components/public/project-case-study"
import { JsonLd } from "@/components/seo/json-ld"
import { extractEntitiesFromProject } from "@/lib/knowledge/entity-extractor"
import { buildKnowledgeGraph, findRelatedKnowledge } from "@/lib/knowledge/graph"
import { parseFaqItems } from "@/lib/knowledge/schemas"
import {
  getProjectBySlug,
  getPublicSettings,
  getPublishedExpertiseAreas,
  getRelatedProjects,
} from "@/lib/public/queries"
import { generateCanonicalUrl, resolveSiteUrl } from "@/lib/seo/canonical"
import {
  buildFaqPageJsonLd,
  buildProjectBreadcrumbJsonLd,
  buildProjectJsonLd,
  mergeJsonLdGraph,
} from "@/lib/seo/jsonld"
import {
  buildNotFoundMetadata,
  buildProjectMetadata,
} from "@/lib/seo/metadata"

export const revalidate = 3600

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params
  const { data: project } = await getProjectBySlug(slug)
  const settings = await getPublicSettings()

  if (!project) {
    return buildNotFoundMetadata("Project Not Found")
  }

  return buildProjectMetadata({ settings }, project)
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params
  const { data: project } = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const [relatedProjects, settings, { data: expertiseAreas }] = await Promise.all([
    getRelatedProjects(project.id, project.tech_stack),
    getPublicSettings(),
    getPublishedExpertiseAreas(),
  ])

  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const graph = siteUrl ? await buildKnowledgeGraph(siteUrl) : null
  const extracted = extractEntitiesFromProject(project)
  const relatedKnowledge = graph
    ? findRelatedKnowledge(graph, {
        id: `project:${project.id}`,
        expertiseSlugs: project.expertise_slugs ?? [],
        concepts: extracted.concepts,
        technologySlugs: extracted.technologies,
      })
    : null

  const expertiseTitlesBySlug = Object.fromEntries(
    (expertiseAreas ?? []).map((area) => [area.slug, area.title])
  )

  const faqItems = parseFaqItems(project.faq)
  const faqJsonLd =
    siteUrl && faqItems.length > 0
      ? buildFaqPageJsonLd(faqItems, generateCanonicalUrl(siteUrl, `/projects/${project.slug}`))
      : null

  const jsonLd =
    siteUrl
      ? mergeJsonLdGraph(
          [
            buildProjectJsonLd(project, settings, siteUrl),
            buildProjectBreadcrumbJsonLd(project.title, project.slug, siteUrl),
            faqJsonLd,
          ].filter(Boolean) as Record<string, unknown>[]
        )
      : null

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ProjectCaseStudy
        expertiseTitlesBySlug={expertiseTitlesBySlug}
        project={project}
        relatedKnowledge={relatedKnowledge}
        relatedProjects={relatedProjects}
      />
    </>
  )
}
