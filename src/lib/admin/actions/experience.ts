"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getAdminMutationClient } from "@/lib/admin/actions/client"
import {
  actionError,
  type ActionResult,
  experienceFormSchema,
  zodFieldErrors,
} from "@/lib/admin/schemas"
import { syncSkillsFromTechStack } from "@/lib/admin/sync-skills-from-tech-stack"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicExperience,
  revalidatePublicSkills,
} from "@/lib/public/revalidate-cache"

const routes = adminResourceRoutes.experience

function revalidateStackPaths() {
  revalidatePath("/")
  revalidatePath("/stack")
  revalidatePath(adminResourceRoutes.skills.list)
  revalidatePublicExperience()
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
}

export async function createExperience(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = experienceFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { count } = await supabase
    .from("experience")
    .select("id", { count: "exact", head: true })

  const { data: experience, error } = await supabase
    .from("experience")
    .insert({
      company: data.company,
      role: data.role,
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description,
      achievements: data.achievements,
      tech_stack: data.tech_stack,
      display_order: count ?? 0,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  try {
    await syncSkillsFromTechStack(supabase, data.tech_stack)
  } catch (syncError) {
    return actionError(
      syncError instanceof Error ? syncError.message : "Failed to sync skills"
    )
  }

  revalidatePath(routes.list)
  revalidateStackPaths()
  redirect(routes.edit(experience.id))
}

export async function updateExperience(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = experienceFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data

  const { error } = await supabase
    .from("experience")
    .update({
      company: data.company,
      role: data.role,
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description,
      achievements: data.achievements,
      tech_stack: data.tech_stack,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  try {
    await syncSkillsFromTechStack(supabase, data.tech_stack)
  } catch (syncError) {
    return actionError(
      syncError instanceof Error ? syncError.message : "Failed to sync skills"
    )
  }

  revalidatePath(routes.list)
  revalidatePath(routes.edit(id))
  revalidateStackPaths()
  return { success: true, data: undefined }
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("experience").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidateStackPaths()
  redirect(routes.list)
}
