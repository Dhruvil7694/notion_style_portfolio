import { notFound } from "next/navigation"

import {
  ContentKnowledgeAfter,
  ContentKnowledgeBefore,
} from "@/features/knowledge-base/components/content-knowledge-blocks"
import { ContentArticle } from "@/features/knowledge-base/components/content-shell"
import { resolveContentKnowledge } from "@/features/portfolio/lib/content-knowledge"
import {
  getContentBySlug,
  getPublicSettings,
} from "@/features/portfolio/lib/queries"
import { JsonLd } from "@/features/seo/components/json-ld"
import {
  buildArticleJsonLd,
  buildBlogMetadata,
  buildContentBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildNotFoundMetadata,
  mergeJsonLdGraph,
  resolveSiteUrl,
} from "@/features/seo/lib"
import { generateCanonicalUrl } from "@/features/seo/lib/canonical"
import { PublicContent } from "@/features/site-shell/components/public-content"
import { ViewTracker } from "@/features/site-shell/components/view-tracker"
import { formatDate } from "@/shared/lib/utils/date"

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
  const pageUrl = siteUrl
    ? generateCanonicalUrl(siteUrl, `/blog/${post.slug}`)
    : null

  const jsonLd = siteUrl
    ? mergeJsonLdGraph(
        [
          buildArticleJsonLd(post, settings, siteUrl, "Writing"),
          buildContentBreadcrumbJsonLd(
            "Writing",
            post.title,
            `/blog/${post.slug}`,
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
        event="article_view"
        payload={{ slug: post.slug, title: post.title }}
      />
      <ContentArticle
        afterContent={
          <ContentKnowledgeAfter
            context={knowledge}
            pageType="writing"
            slug={post.slug}
          />
        }
        beforeContent={<ContentKnowledgeBefore context={knowledge} />}
        excerpt={post.excerpt}
        meta={
          post.published_at
            ? formatDate(post.published_at, "MMMM d, yyyy")
            : null
        }
        title={post.title}
      >
        <PublicContent content={post.content} />
      </ContentArticle>
    </>
  )
}
