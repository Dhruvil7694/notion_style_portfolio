import { notFound } from "next/navigation"

import {
  ContentKnowledgeAfter,
  ContentKnowledgeBefore,
} from "@/components/public/content-knowledge-blocks"
import { ContentArticle } from "@/components/public/content-shell"
import { PublicContent } from "@/components/public/public-content"
import { ViewTracker } from "@/components/public/view-tracker"
import { JsonLd } from "@/components/seo/json-ld"
import { resolveContentKnowledge } from "@/lib/public/content-knowledge"
import { getContentBySlug, getPublicSettings } from "@/lib/public/queries"
import {
  buildArticleJsonLd,
  buildContentBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildNotFoundMetadata,
  buildResearchMetadata,
  buildTechArticleJsonLd,
  mergeJsonLdGraph,
  resolveSiteUrl,
} from "@/lib/seo"
import { generateCanonicalUrl } from "@/lib/seo/canonical"
import { formatDate } from "@/lib/utils/date"

type ResearchDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ResearchDetailPageProps) {
  const { slug } = await params
  const { data: item } = await getContentBySlug("research", slug)
  const settings = await getPublicSettings()

  if (!item) {
    return buildNotFoundMetadata("Research Not Found")
  }

  return buildResearchMetadata({ settings }, item)
}

export default async function ResearchDetailPage({
  params,
}: ResearchDetailPageProps) {
  const { slug } = await params
  const { data: item } = await getContentBySlug("research", slug)

  if (!item) {
    notFound()
  }

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const knowledge = await resolveContentKnowledge(item, siteUrl)
  const pageUrl = siteUrl
    ? generateCanonicalUrl(siteUrl, `/research/${item.slug}`)
    : null

  const jsonLd = siteUrl
    ? mergeJsonLdGraph(
        [
          buildTechArticleJsonLd(item, settings, siteUrl),
          buildArticleJsonLd(item, settings, siteUrl, "Research"),
          buildContentBreadcrumbJsonLd(
            "Research",
            item.title,
            `/research/${item.slug}`,
            siteUrl
          ),
          pageUrl && knowledge.faqItems.length > 0
            ? buildFaqPageJsonLd(knowledge.faqItems, pageUrl)
            : null,
        ].filter(Boolean) as Record<string, unknown>[]
      )
    : null

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ViewTracker
        event="research_view"
        payload={{ slug: item.slug, title: item.title }}
      />
      <ContentArticle
        afterContent={
          <ContentKnowledgeAfter
            context={knowledge}
            pageType="research"
            slug={item.slug}
          />
        }
        beforeContent={<ContentKnowledgeBefore context={knowledge} />}
        excerpt={item.excerpt}
        meta={
          item.published_at
            ? formatDate(item.published_at, "MMMM d, yyyy")
            : null
        }
        title={item.title}
      >
        <PublicContent content={item.content} />
      </ContentArticle>
    </>
  )
}
