import { notFound } from "next/navigation"

import { getContentBySlug } from "@/lib/public/queries"
import { createOgImageResponse, ogImageRouteConfig } from "@/lib/seo/og-image"

export const alt = "Research preview"
export const size = ogImageRouteConfig.size
export const contentType = ogImageRouteConfig.contentType

type ResearchOgImageProps = {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: ResearchOgImageProps) {
  const { slug } = await params
  const { data: item } = await getContentBySlug("research", slug)

  if (!item) {
    notFound()
  }

  return createOgImageResponse({
    title: item.title,
    eyebrow: item.tags?.[0] || "Research",
  })
}
