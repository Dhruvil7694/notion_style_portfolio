import { notFound } from "next/navigation"

import { EntityNavigationSections } from "@/features/discovery/components/discovery-ui"
import { resolveEntityNavigation } from "@/features/discovery/lib/explorer"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { KnowledgeRelatedSection } from "@/features/knowledge-base/components/knowledge-related-section"
import { TechnologyHubMeta } from "@/features/knowledge-base/components/technology-hub-meta"
import {
  buildKnowledgeGraph,
  getTechnologyBundle,
} from "@/features/knowledge-base/lib/graph"
import { resolveTechnologyLabel } from "@/features/knowledge-base/lib/taxonomy"
import {
  getPublicSettings,
  getTechnologyBySlug,
} from "@/features/portfolio/lib/queries"
import { JsonLd } from "@/features/seo/components/json-ld"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import {
  buildCollectionPageJsonLd,
  mergeJsonLdGraph,
} from "@/features/seo/lib/jsonld"
import { buildBaseMetadata } from "@/features/seo/lib/metadata"
import { ViewTracker } from "@/features/site-shell/components/view-tracker"

type TechnologyDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TechnologyDetailPageProps) {
  const { slug } = await params
  const [{ data: record }, settings] = await Promise.all([
    getTechnologyBySlug(slug),
    getPublicSettings(),
  ])
  const label = record?.title ?? resolveTechnologyLabel(slug)

  return buildBaseMetadata(
    { settings },
    {
      title: label,
      description:
        record?.summary ??
        record?.description ??
        `Projects, research, writing, and automations using ${label}.`,
      path: `/technology/${slug}`,
    }
  )
}

export default async function TechnologyDetailPage({
  params,
}: TechnologyDetailPageProps) {
  const { slug } = await params
  const [{ data: record }, settings] = await Promise.all([
    getTechnologyBySlug(slug),
    getPublicSettings(),
  ])
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    notFound()
  }

  const graph = await buildKnowledgeGraph(siteUrl)
  if (!graph) {
    notFound()
  }

  const bundle = getTechnologyBundle(graph, slug)
  const navigation = resolveEntityNavigation(graph, "technology", slug)

  if (!bundle.technology) {
    notFound()
  }

  const jsonLd = mergeJsonLdGraph([
    buildCollectionPageJsonLd(
      bundle.technology.title,
      record?.summary ??
        record?.description ??
        `Content using ${bundle.technology.title}`,
      `/technology/${slug}`,
      siteUrl
    ),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <ViewTracker
        event="technology_view"
        payload={{ slug, title: bundle.technology.title }}
      />
      <PageShell
        description={
          record?.summary ?? bundle.technology.description ?? undefined
        }
        title={bundle.technology.title}
      >
        {record?.description ? (
          <p className="technology-page-description">{record.description}</p>
        ) : null}

        <TechnologyHubMeta
          category={
            record?.category ??
            (bundle.technology.metadata?.category as string | null)
          }
          documentationUrl={
            record?.documentation_url ??
            (bundle.technology.metadata?.documentationUrl as string | null)
          }
          registered={Boolean(record)}
          websiteUrl={
            record?.website_url ??
            (bundle.technology.metadata?.websiteUrl as string | null)
          }
        />

        <EntityNavigationSections
          relatedConcepts={navigation.relatedConcepts}
          relatedExpertise={navigation.relatedExpertise}
          relatedTechnologies={navigation.relatedTechnologies}
        />

        <KnowledgeRelatedSection items={bundle.projects} title="Projects" />
        <KnowledgeRelatedSection items={bundle.research} title="Research" />
        <KnowledgeRelatedSection items={bundle.writing} title="Writing" />
        <KnowledgeRelatedSection
          items={bundle.automations}
          title="Automations"
        />
      </PageShell>
    </>
  )
}
