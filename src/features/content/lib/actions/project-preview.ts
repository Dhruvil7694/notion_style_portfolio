"use server"

import { createClient } from "@/shared/lib/supabase/server"

export type ProjectPreviewData = {
  id: string
  title: string
  summary: string
  tech_stack: string[] | null
  status: string
}

export async function fetchProjectPreviewAction(
  projectId: string
): Promise<
  | { success: true; data: ProjectPreviewData }
  | { success: false; error: string }
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, summary, tech_stack, status")
    .eq("id", projectId)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Project not found" }
  }

  return { success: true, data }
}

export async function fetchProjectPreviewsAction(
  projectIds: string[]
): Promise<Record<string, ProjectPreviewData>> {
  if (projectIds.length === 0) {
    return {}
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("id, title, summary, tech_stack, status")
    .in("id", projectIds)

  const map: Record<string, ProjectPreviewData> = {}
  for (const project of data ?? []) {
    map[project.id] = project
  }

  return map
}
