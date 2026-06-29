"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import {
  actionError,
  type ActionResult,
  contentFormSchema,
  resolvePublishedAt,
  zodFieldErrors,
} from "@/features/admin/lib/schemas"
import { serializeContent } from "@/features/content/lib/serializer"
import {
  revalidateKnowledgeAndDiscovery,
  revalidatePublicContent,
} from "@/features/portfolio/lib/revalidate-cache"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"

const routes = adminResourceRoutes.content

export async function createContent(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = contentFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data = parsed.data
  const contentDocument = serializeContent(data.content)

  const { data: content, error } = await supabase
    .from("content")
    .insert({
      type: data.type,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      tags: data.tags,
      status: data.status,
      content: contentDocument,
      published_at: resolvePublishedAt(data.status, null),
      ai_summary: data.ai_summary || null,
      key_takeaways: data.key_takeaways,
      expertise_slugs: data.expertise_slugs,
      concepts: data.concepts,
      faq: data.faq,
    })
    .select("id")
    .single()

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicContent(data.type)
  revalidateKnowledgeAndDiscovery()
  redirect(routes.edit(content.id))
}

export async function updateContent(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = contentFormSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const { data: existing, error: fetchError } = await supabase
    .from("content")
    .select("published_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    return actionError(fetchError.message)
  }

  if (!existing) {
    return actionError("Content not found")
  }

  const data = parsed.data
  const contentDocument = serializeContent(data.content)
  const { error } = await supabase
    .from("content")
    .update({
      type: data.type,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      tags: data.tags,
      status: data.status,
      content: contentDocument,
      published_at: resolvePublishedAt(data.status, existing.published_at),
      ai_summary: data.ai_summary || null,
      key_takeaways: data.key_takeaways,
      expertise_slugs: data.expertise_slugs,
      concepts: data.concepts,
      faq: data.faq,
    })
    .eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePath(routes.edit(id))
  revalidatePath("/expertise")
  revalidatePath("/technology")
  if (data.type === "research") {
    revalidatePath(`/research/${data.slug}`)
  } else if (data.type === "blog") {
    revalidatePath(`/blog/${data.slug}`)
  } else if (data.type === "automation") {
    revalidatePath(`/automations/${data.slug}`)
  }
  revalidatePublicContent(data.type)
  revalidateKnowledgeAndDiscovery()
  return { success: true, data: undefined }
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const supabase = await getAdminMutationClient()
  const { error } = await supabase.from("content").delete().eq("id", id)

  if (error) {
    return actionError(error.message)
  }

  revalidatePath(routes.list)
  revalidatePublicContent()
  revalidateKnowledgeAndDiscovery()
  redirect(routes.list)
}
