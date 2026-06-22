import { notFound } from "next/navigation"

import { ProjectForm } from "@/features/admin/forms/project-form"
import { getProjectById } from "@/lib/admin/queries"

type AdminEditProjectPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdminEditProjectPageProps) {
  const { id } = await params
  const { data: project } = await getProjectById(id)

  return {
    title: project ? `Edit ${project.title}` : "Edit Project",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditProjectPage({
  params,
}: AdminEditProjectPageProps) {
  const { id } = await params
  const { data: project, error } = await getProjectById(id)

  if (error) {
    throw new Error(error.message)
  }

  if (!project) {
    notFound()
  }

  return <ProjectForm mode="edit" project={project} />
}
