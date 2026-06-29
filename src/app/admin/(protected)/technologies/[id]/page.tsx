import { notFound } from "next/navigation"

import { TechnologyForm } from "@/features/admin/components/forms/technology-form"
import { getAdminMutationClient } from "@/features/admin/lib/actions/client"

type AdminEditTechnologyPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: AdminEditTechnologyPageProps) {
  const { id } = await params
  const supabase = await getAdminMutationClient()
  const { data } = await supabase
    .from("technology_registry")
    .select("title")
    .eq("id", id)
    .maybeSingle()

  return {
    title: data?.title ? `Edit ${data.title}` : "Edit Technology",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditTechnologyPage({
  params,
}: AdminEditTechnologyPageProps) {
  const { id } = await params
  const supabase = await getAdminMutationClient()
  const { data: entry } = await supabase
    .from("technology_registry")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!entry) {
    notFound()
  }

  return <TechnologyForm entry={entry} mode="edit" />
}
