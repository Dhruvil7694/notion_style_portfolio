import { notFound } from "next/navigation"

import { ConceptForm } from "@/features/admin/forms/concept-form"
import { getAdminMutationClient } from "@/lib/admin/actions/client"

type AdminEditConceptPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AdminEditConceptPageProps) {
  const { id } = await params
  const supabase = await getAdminMutationClient()
  const { data } = await supabase.from("concept_registry").select("title").eq("id", id).maybeSingle()

  return {
    title: data?.title ? `Edit ${data.title}` : "Edit Concept",
    robots: { index: false, follow: false },
  }
}

export default async function AdminEditConceptPage({ params }: AdminEditConceptPageProps) {
  const { id } = await params
  const supabase = await getAdminMutationClient()
  const { data: entry } = await supabase.from("concept_registry").select("*").eq("id", id).maybeSingle()

  if (!entry) {
    notFound()
  }

  return <ConceptForm entry={entry} mode="edit" />
}
