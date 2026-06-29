import { notFound } from "next/navigation"

import { getContentBySlug } from "@/features/portfolio/lib/queries"
import {
  createOgImageResponse,
  ogImageRouteConfig,
} from "@/features/seo/lib/og-image"

export const alt = "Automation preview"
export const size = ogImageRouteConfig.size
export const contentType = ogImageRouteConfig.contentType

type AutomationOgImageProps = {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: AutomationOgImageProps) {
  const { slug } = await params
  const { data: item } = await getContentBySlug("automation", slug)

  if (!item) {
    notFound()
  }

  return createOgImageResponse({
    title: item.title,
    eyebrow: "Automation",
  })
}
