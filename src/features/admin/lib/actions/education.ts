"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  actionError,
  type ActionResult,
  educationFormSchema,
  zodFieldErrors,
} from "@/features/admin/lib/schemas"
import { revalidatePublicEducation } from "@/features/portfolio/lib/revalidate-cache"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"

const routes = adminResourceRoutes.education

export async function createEducation(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = educationFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { data: education, error } = await supabase
    .from("education")
    .insert({
      institution: data.institution,
      degree: data.degree,
      description: data.description,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicEducation()
  return { success: true, data: { id: education.id } }
}

export async function updateEducation(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = educationFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { error } = await supabase
    .from("education")
    .update({
      institution: data.institution,
      degree: data.degree,
      description: data.description,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath(routes.edit(id))
  revalidatePublicEducation()
  return { success: true, data: undefined }
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("education").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicEducation()
  redirect(routes.list)
}
