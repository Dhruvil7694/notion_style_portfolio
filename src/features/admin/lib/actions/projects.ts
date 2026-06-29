"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  actionError,
  type ActionResult,
  type ProjectFormData,
  projectFormSchema,
  resolvePublishedAt,
  zodFieldErrors,
} from "@/features/admin/lib/schemas"
import { syncSkillsFromTechStack } from "@/features/admin/lib/sync-skills-from-tech-stack"
import { serializeContent } from "@/features/content/lib/serializer"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicProjects,
  revalidatePublicSkills,
} from "@/features/portfolio/lib/revalidate-cache"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"

const routes = adminResourceRoutes.projects

function emptyArrayToNull<T>(items: T[]): T[] | null {
  return items.length > 0 ? items : null
}

function buildProjectPayload(
  data: ProjectFormData,
  publishedAt: string | null
) {
  const projectUrl = data.project_url || null

  return {
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    tagline: data.tagline || null,
    icon_name: data.icon_name || null,
    cover_image: data.cover_image,
    thumbnail: data.thumbnail,
    demo_video_url: data.demo_video_url,
    architecture_image: data.architecture_image,
    year: data.year || null,
    category: data.category || null,
    role: data.role || null,
    project_url: projectUrl,
    github_url: data.github_url,
    live_url: projectUrl,
    challenge: data.challenge || null,
    solution: data.solution || null,
    impact: data.impact || null,
    overview: data.overview || null,
    problem: data.problem || null,
    why_built: data.why_built || null,
    approach: emptyArrayToNull(data.approach),
    ai_design: emptyArrayToNull(data.ai_design),
    architecture: emptyArrayToNull(data.architecture),
    ai_design_nodes: emptyArrayToNull(data.ai_design_nodes),
    ai_design_edges: emptyArrayToNull(data.ai_design_edges),
    architecture_nodes: emptyArrayToNull(data.architecture_nodes),
    architecture_edges: emptyArrayToNull(data.architecture_edges),
    challenges: data.challenges,
    results: emptyArrayToNull(data.results),
    learnings: emptyArrayToNull(data.learnings),
    ai_summary: data.ai_summary || null,
    key_takeaways: data.key_takeaways,
    concepts: data.concepts,
    expertise_slugs: data.expertise_slugs,
    technologies: data.technologies,
    project_facts: data.project_facts,
    faq: data.faq,
    metrics: data.metrics,
    tradeoffs: data.tradeoffs,
    my_contribution: emptyArrayToNull(data.my_contribution),
    tech_stack_groups: emptyArrayToNull(data.tech_stack_groups),
    timeline: emptyArrayToNull(data.timeline),
    demo_images: emptyArrayToNull(
      data.gallery.map(({ url, caption, alt }) => ({ url, caption, alt }))
    ),
    gallery: emptyArrayToNull(data.gallery),
    hover_preview_enabled: data.hover_preview_enabled,
    display_order: data.display_order,
    tech_stack: data.tech_stack,
    featured: data.featured,
    status: data.status,
    content: serializeContent(data.content),
    published_at: publishedAt,
  }
}

export async function createProject(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = projectFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })

  const displayOrder =
    data.display_order === 0 ? (count ?? 0) : data.display_order

  const payload = buildProjectPayload(
    { ...data, display_order: displayOrder },
    resolvePublishedAt(data.status, null)
  )

  const { data: project, error } = await supabase
    .from("projects")
    .insert(payload)
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
  revalidatePath("/")
  revalidatePath("/stack")
  revalidatePath("/admin/skills")
  revalidatePublicProjects(data.slug)
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.edit(project.id))
}

export async function updateProject(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = projectFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("published_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    return actionError(fetchError.message)
  }

  if (!existing) {
    return actionError("Project not found")
  }

  const data = parsed.data
  const payload = buildProjectPayload(
    data,
    resolvePublishedAt(data.status, existing.published_at)
  )

  const { error } = await supabase.from("projects").update(payload).eq("id", id)

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
  revalidatePath("/")
  revalidatePath("/stack")
  revalidatePath("/admin/skills")
  revalidatePublicProjects(data.slug)
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
  return { success: true, data: undefined }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicProjects()
  revalidatePublicSkills()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.list)
}

export async function reorderProjects(
  orderedIds: unknown
): Promise<ActionResult> {
  const parsed = z
    .array(z.string().uuid())
    .min(1, "At least one project is required")
    .safeParse(orderedIds)

  if (!parsed.success) {
    return actionError("Invalid project order")
  }

  const supabase = await getAdminMutationClient()
  const updates = parsed.data.map((id, index) =>
    supabase.from("projects").update({ display_order: index }).eq("id", id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    return actionError(failed.error.message)
  }

  revalidatePath(routes.list)
  revalidatePath("/")
  revalidatePath("/projects")
  revalidatePath("/stack")
  revalidatePublicProjects()
  revalidateKnowledgeAndDiscovery()

  return { success: true, data: undefined }
}
