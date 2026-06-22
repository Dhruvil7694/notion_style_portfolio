import { notFound } from "next/navigation"

import { getProjectBySlug } from "@/lib/public/queries"
import { createOgImageResponse, ogImageRouteConfig } from "@/lib/seo/og-image"

export const alt = "Project preview"
export const size = ogImageRouteConfig.size
export const contentType = ogImageRouteConfig.contentType

type ProjectOgImageProps = {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: ProjectOgImageProps) {
  const { slug } = await params
  const { data: project } = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  return createOgImageResponse({
    title: project.title,
    eyebrow: project.category || "Project",
  })
}
