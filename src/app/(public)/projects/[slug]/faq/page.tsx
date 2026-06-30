import { notFound } from "next/navigation"

import {
  paginateFaqItems,
  PROJECT_FAQ_PAGE_SIZE,
} from "@/features/knowledge-base/lib/faq-pagination"
import { resolveProjectFaqFromRecord } from "@/features/knowledge-base/lib/faq-templates"
import {
  getProjectBySlug,
  getPublicSettings,
} from "@/features/portfolio/lib/queries"
import { ProjectFaqPageContent } from "@/features/projects/components/project-faq-page-content"
import { JsonLd } from "@/features/seo/components/json-ld"
import {
  generateCanonicalUrl,
  resolveSiteUrl,
} from "@/features/seo/lib/canonical"
import {
  buildFaqPageJsonLd,
  buildProjectBreadcrumbJsonLd,
  mergeJsonLdGraph,
} from "@/features/seo/lib/jsonld"
import {
  buildNotFoundMetadata,
  buildProjectFaqMetadata,
} from "@/features/seo/lib/metadata"

export const revalidate = 3600

type ProjectFaqPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: ProjectFaqPageProps) {
  const { slug } = await params
  const { data: project } = await getProjectBySlug(slug)
  const settings = await getPublicSettings()

  if (!project) {
    return buildNotFoundMetadata("Project FAQ Not Found")
  }

  return buildProjectFaqMetadata({ settings }, project)
}

export default async function ProjectFaqPage({
  params,
  searchParams,
}: ProjectFaqPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const { data: project } = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const faqItems = resolveProjectFaqFromRecord(project)

  if (faqItems.length === 0) {
    notFound()
  }

  const requestedPage = Number.parseInt(pageParam ?? "1", 10)
  const page = Number.isFinite(requestedPage) ? requestedPage : 1
  const pagination = paginateFaqItems(faqItems, page, PROJECT_FAQ_PAGE_SIZE)

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const faqJsonLd =
    siteUrl && faqItems.length > 0
      ? buildFaqPageJsonLd(
          faqItems,
          generateCanonicalUrl(siteUrl, `/projects/${project.slug}/faq`)
        )
      : null

  const jsonLd = siteUrl
    ? mergeJsonLdGraph(
        [
          buildProjectBreadcrumbJsonLd(
            project.title,
            project.slug,
            siteUrl,
            "FAQ"
          ),
          faqJsonLd,
        ].filter(Boolean) as Record<string, unknown>[]
      )
    : null

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ProjectFaqPageContent
        currentPage={pagination.currentPage}
        faqItems={pagination.items}
        projectSlug={project.slug}
        projectTitle={project.title}
        totalPages={pagination.totalPages}
      />
    </>
  )
}
