import { notFound } from "next/navigation"

import {
  ContentKnowledgeAfter,
  ContentKnowledgeBefore,
} from "@/components/public/content-knowledge-blocks"
import { ContentArticle } from "@/components/public/content-shell"
import { PublicContent } from "@/components/public/public-content"
import { JsonLd } from "@/components/seo/json-ld"
import { resolveContentKnowledge } from "@/lib/public/content-knowledge"
import { getContentBySlug, getPublicSettings } from "@/lib/public/queries"
import {
  buildArticleJsonLd,
  buildBlogMetadata,
  buildContentBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildNotFoundMetadata,
  mergeJsonLdGraph,
  resolveSiteUrl,
} from "@/lib/seo"
import { generateCanonicalUrl } from "@/lib/seo/canonical"
import { formatDate } from "@/lib/utils/date"

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const { data: post } = await getContentBySlug("blog", slug)
  const settings = await getPublicSettings()

  if (!post) {
    return buildNotFoundMetadata("Post Not Found")
  }

  return buildBlogMetadata({ settings }, post)
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const { data: post } = await getContentBySlug("blog", slug)

  if (!post) {
    notFound()
  }

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const knowledge = await resolveContentKnowledge(post, siteUrl)
  const pageUrl = siteUrl ? generateCanonicalUrl(siteUrl, `/blog/${post.slug}`) : null

  const jsonLd =
    siteUrl
      ? mergeJsonLdGraph(
          [
            buildArticleJsonLd(post, settings, siteUrl, "Writing"),
            buildContentBreadcrumbJsonLd("Writing", post.title, `/blog/${post.slug}`, siteUrl),
            pageUrl && knowledge.faqItems.length > 0
              ? buildFaqPageJsonLd(knowledge.faqItems, pageUrl)
              : null,
          ].filter(Boolean) as Record<string, unknown>[]
        )
      : null

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ContentArticle
        afterContent={<ContentKnowledgeAfter context={knowledge} />}
        beforeContent={<ContentKnowledgeBefore context={knowledge} />}
        excerpt={post.excerpt}
        meta={post.published_at ? formatDate(post.published_at, "MMMM d, yyyy") : null}
        title={post.title}
      >
        <PublicContent content={post.content} />
      </ContentArticle>
    </>
  )
}
