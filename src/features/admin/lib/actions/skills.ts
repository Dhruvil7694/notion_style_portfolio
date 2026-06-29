"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  actionError,
  type ActionResult,
  skillFormSchema,
  zodFieldErrors,
} from "@/features/admin/lib/schemas"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicSkills,
} from "@/features/portfolio/lib/revalidate-cache"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"

const routes = adminResourceRoutes.skills

function revalidatePublicSkillPaths() {
  revalidatePath("/")
  revalidatePath("/stack")
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
}

export async function createSkill(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = skillFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { count } = await supabase
    .from("skills")
    .select("id", { count: "exact", head: true })

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      category: data.category,
      name: data.name,
      proficiency: data.proficiency,
      show_on_landing: data.show_on_landing,
      display_order: count ?? 0,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicSkillPaths()
  return { success: true, data: { id: skill.id } }
}

export async function updateSkill(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = skillFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { error } = await supabase
    .from("skills")
    .update({
      category: data.category,
      name: data.name,
      proficiency: data.proficiency,
      show_on_landing: data.show_on_landing,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath(routes.edit(id))
  revalidatePublicSkillPaths()
  return { success: true, data: undefined }
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("skills").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicSkillPaths()
  redirect(routes.list)
}
