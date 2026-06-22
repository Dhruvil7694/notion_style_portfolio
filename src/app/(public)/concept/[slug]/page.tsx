import { notFound } from "next/navigation"

import { PageShell } from "@/components/public/content-shell"
import { EntityNavigationSections } from "@/components/public/discovery-ui"
import { KnowledgeRelatedSection } from "@/components/public/knowledge-related-section"
import { JsonLd } from "@/components/seo/json-ld"
import { resolveEntityNavigation } from "@/lib/discovery/explorer"
import { buildKnowledgeGraph, getConceptBundle } from "@/lib/knowledge/graph"
import { getConceptBySlug, getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import { buildCollectionPageJsonLd, buildDefinedTermJsonLd, mergeJsonLdGraph } from "@/lib/seo/jsonld"
import { buildBaseMetadata } from "@/lib/seo/metadata"

type ConceptDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ConceptDetailPageProps) {
  const { slug } = await params
  const { data: record } = await getConceptBySlug(slug)
  const settings = await getPublicSettings()

  const title = record?.title ?? slug.replace(/-/g, " ")

  return buildBaseMetadata(
    { settings },
    {
      title: `${title} | Concept`,
      description: record?.summary ?? record?.description ?? undefined,
      path: `/concept/${slug}`,
    }
  )
}

export default async function ConceptDetailPage({ params }: ConceptDetailPageProps) {
  const { slug } = await params
  const [{ data: record }, settings] = await Promise.all([
    getConceptBySlug(slug),
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

  const bundle = getConceptBundle(graph, slug)
  const navigation = resolveEntityNavigation(graph, "concept", slug)
  if (!bundle.concept) {
    notFound()
  }

  const jsonLd = mergeJsonLdGraph([
    buildDefinedTermJsonLd(
      {
        title: bundle.concept.title,
        slug,
        description: record?.description,
        summary: record?.summary ?? bundle.concept.description,
      },
      siteUrl,
      "concept"
    ),
    buildCollectionPageJsonLd(
      bundle.concept.title,
      record?.summary ?? bundle.concept.description,
      `/concept/${slug}`,
      siteUrl
    ),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageShell
        description={record?.summary ?? bundle.concept.description ?? undefined}
        title={bundle.concept.title}
      >
        <div className="concept-page">
          {record?.description ? (
            <p className="concept-page-description">{record.description}</p>
          ) : null}

          {record?.why_it_matters ? (
            <section className="concept-page-section">
              <h2 className="knowledge-section-title">Why It Matters</h2>
              <p className="concept-page-body">{record.why_it_matters}</p>
            </section>
          ) : null}

          <KnowledgeRelatedSection items={bundle.relatedExpertise} title="Related Expertise" />
          <KnowledgeRelatedSection items={bundle.relatedConcepts} title="Related Concepts" />
          <EntityNavigationSections relatedTechnologies={navigation.relatedTechnologies} />
          <KnowledgeRelatedSection items={bundle.projects} title="Projects" />
          <KnowledgeRelatedSection items={bundle.research} title="Research" />
          <KnowledgeRelatedSection items={bundle.writing} title="Articles" />
          <KnowledgeRelatedSection items={bundle.automations} title="Automations" />
        </div>
      </PageShell>
    </>
  )
}
