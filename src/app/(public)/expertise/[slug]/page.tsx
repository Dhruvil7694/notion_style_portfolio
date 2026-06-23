import { notFound } from "next/navigation"

import { PageShell } from "@/components/public/content-shell"
import { EntityNavigationSections } from "@/components/public/discovery-ui"
import { KeyTakeawaysList } from "@/components/public/key-takeaways-list"
import { KnowledgeRelatedSection } from "@/components/public/knowledge-related-section"
import { ViewTracker } from "@/components/public/view-tracker"
import { JsonLd } from "@/components/seo/json-ld"
import { resolveEntityNavigation } from "@/lib/discovery/explorer"
import { buildKnowledgeGraph, getExpertiseBundle } from "@/lib/knowledge/graph"
import { getExpertiseAreaBySlug, getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import {
  buildCollectionPageJsonLd,
  buildDefinedTermJsonLd,
  mergeJsonLdGraph,
} from "@/lib/seo/jsonld"
import { buildBaseMetadata } from "@/lib/seo/metadata"

type ExpertiseDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ExpertiseDetailPageProps) {
  const { slug } = await params
  const { data: area } = await getExpertiseAreaBySlug(slug)
  const settings = await getPublicSettings()

  if (!area) {
    return {
      title: "Expertise Not Found",
      robots: { index: false, follow: false },
    }
  }

  return buildBaseMetadata(
    { settings },
    {
      title: `${area.title} | Expertise`,
      description: area.summary ?? area.description ?? undefined,
      path: `/expertise/${area.slug}`,
      keywords: area.keywords,
    }
  )
}

export default async function ExpertiseDetailPage({
  params,
}: ExpertiseDetailPageProps) {
  const { slug } = await params
  const [{ data: area }, settings] = await Promise.all([
    getExpertiseAreaBySlug(slug),
    getPublicSettings(),
  ])

  if (!area) {
    notFound()
  }

  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const graph = siteUrl ? await buildKnowledgeGraph(siteUrl) : null
  const bundle = graph ? getExpertiseBundle(graph, slug) : null
  const navigation = graph
    ? resolveEntityNavigation(graph, "expertise", slug)
    : null

  const jsonLd =
    siteUrl && graph
      ? mergeJsonLdGraph([
          buildDefinedTermJsonLd(area, siteUrl),
          buildCollectionPageJsonLd(
            area.title,
            area.summary ?? area.description,
            `/expertise/${area.slug}`,
            siteUrl
          ),
        ])
      : null

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ViewTracker
        event="expertise_view"
        payload={{ slug: area.slug, title: area.title }}
      />
      <PageShell description={area.summary ?? undefined} title={area.title}>
        <div className="expertise-page">
          {area.description ? (
            <p className="expertise-page-description">{area.description}</p>
          ) : null}

          {area.why_it_matters ? (
            <section className="expertise-page-section">
              <h2 className="knowledge-section-title">Why It Matters</h2>
              <p className="expertise-page-body">{area.why_it_matters}</p>
            </section>
          ) : null}

          {bundle ? (
            <>
              <KnowledgeRelatedSection
                items={bundle.relatedExpertise}
                title="Related Expertise"
              />
              {navigation ? (
                <EntityNavigationSections
                  relatedConcepts={navigation.relatedConcepts}
                  relatedTechnologies={navigation.relatedTechnologies}
                />
              ) : null}
              <KnowledgeRelatedSection
                items={bundle.projects}
                title="Projects Using This Expertise"
              />
              <KnowledgeRelatedSection
                items={bundle.research}
                title="Related Research"
              />
              <KnowledgeRelatedSection
                items={bundle.writing}
                title="Articles About This Expertise"
              />
              <KnowledgeRelatedSection
                items={bundle.automations}
                title="Related Automations"
              />
              <KnowledgeRelatedSection
                items={bundle.technologies}
                title="Technologies Used"
              />
            </>
          ) : null}

          <KeyTakeawaysList items={area.key_takeaways} />
        </div>
      </PageShell>
    </>
  )
}
