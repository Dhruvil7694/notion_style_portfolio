import { notFound } from "next/navigation"

import { EducationForm } from "@/features/admin/forms/education-form"
import { getEducationById } from "@/lib/admin/queries"

type AdminEditEducationPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdminEditEducationPageProps) {
  const { id } = await params
  const { data: education } = await getEducationById(id)

  return {
    title: education
      ? `Edit ${education.degree} — ${education.institution}`
      : "Edit Education",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditEducationPage({
  params,
}: AdminEditEducationPageProps) {
  const { id } = await params
  const { data: education, error } = await getEducationById(id)

  if (error) {
    throw new Error(error.message)
  }

  if (!education) {
    notFound()
  }

  return <EducationForm education={education} mode="edit" />
}
