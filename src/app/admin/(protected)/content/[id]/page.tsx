import { notFound } from "next/navigation"

import { ContentForm } from "@/features/admin/components/forms/content-form"
import { getContentById } from "@/features/admin/lib/queries"

type AdminEditContentPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdminEditContentPageProps) {
  const { id } = await params
  const { data: content } = await getContentById(id)

  return {
    title: content ? `Edit ${content.title}` : "Edit Content",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditContentPage({
  params,
}: AdminEditContentPageProps) {
  const { id } = await params
  const { data: content, error } = await getContentById(id)

  if (error) {
    throw new Error(error.message)
  }

  if (!content) {
    notFound()
  }

  return <ContentForm content={content} mode="edit" />
}
