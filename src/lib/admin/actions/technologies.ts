"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getAdminMutationClient } from "@/lib/admin/actions/client"
import {
  actionError,
  type ActionResult,
  technologyFormSchema,
  zodFieldErrors,
} from "@/lib/admin/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicTechnology,
} from "@/lib/public/revalidate-cache"

const routes = adminResourceRoutes.technologies

function revalidateTechnologyPaths(slug: string) {
  revalidatePath(routes.list)
  revalidatePath("/technology")
  revalidatePath(`/technology/${slug}`)
  revalidatePublicTechnology()
  revalidateKnowledgeAndDiscovery()
}

export async function createTechnologyEntry(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = technologyFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { data: row, error } = await supabase
    .from("technology_registry")
    .insert({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      summary: data.summary || null,
      category: data.category || null,
      website_url: data.website_url || null,
      documentation_url: data.documentation_url || null,
      featured: data.featured,
      display_order: data.display_order,
      status: data.status,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  revalidateTechnologyPaths(data.slug)
  redirect(routes.edit(row.id))
}

export async function updateTechnologyEntry(id: string, input: unknown): Promise<ActionResult> {
  const parsed = technologyFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { error } = await supabase
    .from("technology_registry")
    .update({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      summary: data.summary || null,
      category: data.category || null,
      website_url: data.website_url || null,
      documentation_url: data.documentation_url || null,
      featured: data.featured,
      display_order: data.display_order,
      status: data.status,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidateTechnologyPaths(data.slug)
  return { success: true, data: undefined }
}

export async function deleteTechnologyEntry(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("technology_registry").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath("/technology")
  revalidatePublicTechnology()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.list)
}
