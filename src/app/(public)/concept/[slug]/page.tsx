import { notFound } from "next/navigation"

import { EntityNavigationSections } from "@/features/discovery/components/discovery-ui"
import { resolveEntityNavigation } from "@/features/discovery/lib/explorer"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { KnowledgeRelatedSection } from "@/features/knowledge-base/components/knowledge-related-section"
import {
  buildKnowledgeGraph,
  getConceptBundle,
} from "@/features/knowledge-base/lib/graph"
import {
  getConceptBySlug,
  getPublicSettings,
} from "@/features/portfolio/lib/queries"
import { JsonLd } from "@/features/seo/components/json-ld"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import {
  buildCollectionPageJsonLd,
  buildDefinedTermJsonLd,
  mergeJsonLdGraph,
} from "@/features/seo/lib/jsonld"
import { buildBaseMetadata } from "@/features/seo/lib/metadata"

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
      title: title,
      description: record?.summary ?? record?.description ?? undefined,
      path: `/concept/${slug}`,
    }
  )
}

export default async function ConceptDetailPage({
  params,
}: ConceptDetailPageProps) {
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

          <KnowledgeRelatedSection
            items={bundle.relatedExpertise}
            title="Related Expertise"
          />
          <KnowledgeRelatedSection
            items={bundle.relatedConcepts}
            title="Related Concepts"
          />
          <EntityNavigationSections
            relatedTechnologies={navigation.relatedTechnologies}
          />
          <KnowledgeRelatedSection items={bundle.projects} title="Projects" />
          <KnowledgeRelatedSection items={bundle.research} title="Research" />
          <KnowledgeRelatedSection items={bundle.writing} title="Articles" />
          <KnowledgeRelatedSection
            items={bundle.automations}
            title="Automations"
          />
        </div>
      </PageShell>
    </>
  )
}
