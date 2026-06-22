import { notFound } from "next/navigation"

import { ExpertiseForm } from "@/features/admin/forms/expertise-form"
import { getAdminMutationClient } from "@/lib/admin/actions/client"

type AdminEditExpertisePageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdminEditExpertisePageProps) {
  const { id } = await params
  const supabase = await getAdminMutationClient()
  const { data } = await supabase.from("expertise_areas").select("title").eq("id", id).maybeSingle()

  return {
    title: data?.title ? `Edit ${data.title}` : "Edit Expertise",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditExpertisePage({ params }: AdminEditExpertisePageProps) {
  const { id } = await params
  const supabase = await getAdminMutationClient()
  const { data: area } = await supabase.from("expertise_areas").select("*").eq("id", id).maybeSingle()

  if (!area) {
    notFound()
  }

  return <ExpertiseForm area={area} mode="edit" />
}
