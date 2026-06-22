import { notFound } from "next/navigation"

import { SkillForm } from "@/features/admin/forms/skill-form"
import { getSkillById } from "@/lib/admin/queries"

type AdminEditSkillPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdminEditSkillPageProps) {
  const { id } = await params
  const { data: skill } = await getSkillById(id)

  return {
    title: skill ? `Edit ${skill.name}` : "Edit Skill",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditSkillPage({
  params,
}: AdminEditSkillPageProps) {
  const { id } = await params
  const { data: skill, error } = await getSkillById(id)

  if (error) {
    throw new Error(error.message)
  }

  if (!skill) {
    notFound()
  }

  return <SkillForm mode="edit" skill={skill} />
}
