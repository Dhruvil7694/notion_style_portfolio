"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  actionError,
  type ActionResult,
  expertiseFormSchema,
  zodFieldErrors,
} from "@/features/admin/lib/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicExpertise,
} from "@/features/portfolio/lib/revalidate-cache"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"

const routes = adminResourceRoutes.expertise

export async function createExpertiseArea(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = expertiseFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { data: row, error } = await supabase
    .from("expertise_areas")
    .insert({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      summary: data.summary || null,
      why_it_matters: data.why_it_matters || null,
      key_takeaways: data.key_takeaways,
      keywords: data.keywords,
      related_expertise_slugs: data.related_expertise_slugs,
      icon_name: data.icon_name || null,
      featured: data.featured,
      display_order: data.display_order,
      status: data.status,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath("/expertise")
  revalidatePublicExpertise()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.edit(row.id))
}

export async function updateExpertiseArea(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = expertiseFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { error } = await supabase
    .from("expertise_areas")
    .update({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      summary: data.summary || null,
      why_it_matters: data.why_it_matters || null,
      key_takeaways: data.key_takeaways,
      keywords: data.keywords,
      related_expertise_slugs: data.related_expertise_slugs,
      icon_name: data.icon_name || null,
      featured: data.featured,
      display_order: data.display_order,
      status: data.status,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath("/expertise")
  revalidatePath(`/expertise/${data.slug}`)
  revalidatePublicExpertise()
  revalidateKnowledgeAndDiscovery()
  return { success: true, data: undefined }
}

export async function deleteExpertiseArea(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("expertise_areas").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath("/expertise")
  revalidatePublicExpertise()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.list)
}
