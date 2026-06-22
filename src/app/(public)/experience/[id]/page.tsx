import { notFound } from "next/navigation"

import { ExperienceArticle } from "@/components/public/experience-article"
import { getExperienceById, getPublicSettings } from "@/lib/public/queries"
import { createPageMetadata } from "@/lib/utils/metadata"

type ExperienceDetailPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ExperienceDetailPageProps) {
  const { id } = await params
  const { data: experience } = await getExperienceById(id)
  const settings = await getPublicSettings()

  if (!experience) {
    return createPageMetadata({ title: "Experience Not Found", noIndex: true })
  }

  return createPageMetadata({
    title: `${experience.role} at ${experience.company}`,
    description: experience.description ?? undefined,
    path: `/experience/${experience.id}`,
    siteName: settings.site.site_name,
    siteUrl: settings.site.site_url,
  })
}

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const { id } = await params
  const { data: experience } = await getExperienceById(id)

  if (!experience) {
    notFound()
  }

  return <ExperienceArticle experience={experience} />
}
