import { notFound } from "next/navigation"

import { PageShell } from "@/components/public/content-shell"
import { EntityNavigationSections } from "@/components/public/discovery-ui"
import { KnowledgeRelatedSection } from "@/components/public/knowledge-related-section"
import { TechnologyHubMeta } from "@/components/public/technology-hub-meta"
import { ViewTracker } from "@/components/public/view-tracker"
import { JsonLd } from "@/components/seo/json-ld"
import { resolveEntityNavigation } from "@/lib/discovery/explorer"
import { buildKnowledgeGraph, getTechnologyBundle } from "@/lib/knowledge/graph"
import { resolveTechnologyLabel } from "@/lib/knowledge/taxonomy"
import { getPublicSettings, getTechnologyBySlug } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import { buildCollectionPageJsonLd, mergeJsonLdGraph } from "@/lib/seo/jsonld"
import { buildBaseMetadata } from "@/lib/seo/metadata"

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
