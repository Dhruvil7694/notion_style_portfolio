import { notFound } from "next/navigation"

import { getContentBySlug } from "@/lib/public/queries"
import { createOgImageResponse, ogImageRouteConfig } from "@/lib/seo/og-image"

export const alt = "Writing preview"
export const size = ogImageRouteConfig.size
export const contentType = ogImageRouteConfig.contentType

type BlogOgImageProps = {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: BlogOgImageProps) {
  const { slug } = await params
  const { data: post } = await getContentBySlug("blog", slug)

  if (!post) {
    notFound()
  }

  return createOgImageResponse({
    title: post.title,
    eyebrow: "Writing",
  })
}
