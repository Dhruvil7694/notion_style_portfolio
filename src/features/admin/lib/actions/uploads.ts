"use server"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"
import { actionError, type ActionResult } from "@/features/admin/lib/schemas"
import { revalidatePublicResume } from "@/features/portfolio/lib/revalidate-cache"
import { storageConfig } from "@/shared/config/storage"

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

export async function uploadProjectCoverImage(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return actionError("Choose an image file to upload.")
  }

  if (file.size > storageConfig.maxUploadSizeBytes) {
    return actionError("Image must be 5 MB or smaller.")
  }

  if (
    !storageConfig.allowedImageMimeTypes.includes(
      file.type as (typeof storageConfig.allowedImageMimeTypes)[number]
    )
  ) {
    return actionError("Use a JPEG, PNG, WebP, or GIF image.")
  }

  const projectId = String(formData.get("projectId") ?? "").trim()
  const projectSlug = String(formData.get("projectSlug") ?? "").trim()
  const folder = projectId || projectSlug || "drafts"
  const extension = MIME_EXTENSION[file.type] ?? "img"
  const filename =
    sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "cover"
  const path = `projects/${folder}/cover-${Date.now()}-${filename}.${extension}`

  const supabase = await getAdminMutationClient()
  const { error } = await supabase.storage
    .from(storageConfig.buckets.publicAssets)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return actionError(error.message)
  }

  const { data } = supabase.storage
    .from(storageConfig.buckets.publicAssets)
    .getPublicUrl(path)

  return { success: true, data: { url: data.publicUrl } }
}

export async function uploadProjectDemoImage(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return actionError("Choose an image file to upload.")
  }

  if (file.size > storageConfig.maxUploadSizeBytes) {
    return actionError("Image must be 5 MB or smaller.")
  }

  if (
    !storageConfig.allowedImageMimeTypes.includes(
      file.type as (typeof storageConfig.allowedImageMimeTypes)[number]
    )
  ) {
    return actionError("Use a JPEG, PNG, WebP, or GIF image.")
  }

  const projectId = String(formData.get("projectId") ?? "").trim()
  const projectSlug = String(formData.get("projectSlug") ?? "").trim()
  const folder = projectId || projectSlug || "drafts"
  const extension = MIME_EXTENSION[file.type] ?? "img"
  const filename = sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "demo"
  const path = `projects/${folder}/demo-${Date.now()}-${filename}.${extension}`

  const supabase = await getAdminMutationClient()
  const { error } = await supabase.storage
    .from(storageConfig.buckets.publicAssets)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return actionError(error.message)
  }

  const { data } = supabase.storage
    .from(storageConfig.buckets.publicAssets)
    .getPublicUrl(path)

  return { success: true, data: { url: data.publicUrl } }
}

export async function uploadProfileAvatar(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return actionError("Choose an image file to upload.")
  }

  if (file.size > storageConfig.maxUploadSizeBytes) {
    return actionError("Image must be 5 MB or smaller.")
  }

  if (
    !storageConfig.allowedImageMimeTypes.includes(
      file.type as (typeof storageConfig.allowedImageMimeTypes)[number]
    )
  ) {
    return actionError("Use a JPEG, PNG, WebP, or GIF image.")
  }

  const extension = MIME_EXTENSION[file.type] ?? "img"
  const filename =
    sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "avatar"
  const path = `avatars/profile-${Date.now()}-${filename}.${extension}`

  const supabase = await getAdminMutationClient()
  const { error } = await supabase.storage
    .from(storageConfig.buckets.publicAssets)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return actionError(error.message)
  }

  const { data } = supabase.storage
    .from(storageConfig.buckets.publicAssets)
    .getPublicUrl(path)

  return { success: true, data: { url: data.publicUrl } }
}

export async function uploadResumePdf(
  formData: FormData
): Promise<ActionResult<{ url: string; version: number }>> {
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return actionError("Choose a PDF file to upload.")
  }

  if (file.type !== "application/pdf") {
    return actionError("Only PDF files are accepted.")
  }

  if (file.size > 10 * 1024 * 1024) {
    return actionError("PDF must be 10 MB or smaller.")
  }

  const supabase = await getAdminMutationClient()

  const { data: existing } = await supabase
    .from("resumes")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (existing?.version ?? 0) + 1
  const path = `resume-v${nextVersion}-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(storageConfig.buckets.resume)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    })

  if (uploadError) return actionError(uploadError.message)

  const { data: urlData } = supabase.storage
    .from(storageConfig.buckets.resume)
    .getPublicUrl(path)

  const publicUrl = urlData.publicUrl

  await supabase.from("resumes").update({ is_active: false }).neq("id", "")

  const { error: insertError } = await supabase.from("resumes").insert({
    file_path: publicUrl,
    version: nextVersion,
    is_active: true,
  })

  if (insertError) return actionError(insertError.message)

  revalidatePublicResume()

  return { success: true, data: { url: publicUrl, version: nextVersion } }
}
