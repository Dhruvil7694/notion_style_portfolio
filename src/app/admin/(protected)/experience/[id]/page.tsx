import { notFound } from "next/navigation"

import { ExperienceForm } from "@/features/admin/components/forms/experience-form"
import { getExperienceById } from "@/features/admin/lib/queries"

type AdminEditExperiencePageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: AdminEditExperiencePageProps) {
  const { id } = await params
  const { data: experience } = await getExperienceById(id)

  return {
    title: experience
      ? `Edit ${experience.role} at ${experience.company}`
      : "Edit Experience",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditExperiencePage({
  params,
}: AdminEditExperiencePageProps) {
  const { id } = await params
  const { data: experience, error } = await getExperienceById(id)

  if (error) {
    throw new Error(error.message)
  }

  if (!experience) {
    notFound()
  }

  return <ExperienceForm experience={experience} mode="edit" />
}
