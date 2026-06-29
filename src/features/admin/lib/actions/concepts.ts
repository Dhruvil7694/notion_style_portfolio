"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  actionError,
  type ActionResult,
  conceptFormSchema,
  zodFieldErrors,
} from "@/features/admin/lib/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicConcept,
} from "@/features/portfolio/lib/revalidate-cache"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"

const routes = adminResourceRoutes.concepts

function revalidateConceptPaths(slug: string) {
  revalidatePath(routes.list)
  revalidatePath("/concept")
  revalidatePath(`/concept/${slug}`)
  revalidatePublicConcept()
  revalidateKnowledgeAndDiscovery()
}

export async function createConceptEntry(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = conceptFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { data: row, error } = await supabase
    .from("concept_registry")
    .insert({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      summary: data.summary || null,
      why_it_matters: data.why_it_matters || null,
      related_concept_slugs: data.related_concept_slugs,
      related_expertise_slugs: data.related_expertise_slugs,
      featured: data.featured,
      display_order: data.display_order,
      status: data.status,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  revalidateConceptPaths(data.slug)
  return { success: true, data: { id: row.id } }
}

export async function updateConceptEntry(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = conceptFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { error } = await supabase
    .from("concept_registry")
    .update({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      summary: data.summary || null,
      why_it_matters: data.why_it_matters || null,
      related_concept_slugs: data.related_concept_slugs,
      related_expertise_slugs: data.related_expertise_slugs,
      featured: data.featured,
      display_order: data.display_order,
      status: data.status,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidateConceptPaths(data.slug)
  return { success: true, data: undefined }
}

export async function deleteConceptEntry(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase
    .from("concept_registry")
    .delete()
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath("/concept")
  revalidatePublicConcept()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.list)
}
