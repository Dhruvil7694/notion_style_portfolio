"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import {
  aboutPageFormSchema,
  actionError,
  type ActionResult,
  profilePersistSchema,
  settingsPersistSchema,
  zodFieldErrors,
} from "@/lib/admin/schemas"
import { revalidatePublicLayoutData } from "@/lib/public/revalidate-cache"

const PUBLIC_PATHS = ["/", "/about"]
const ADMIN_PATHS = ["/admin/settings", "/admin/profile", "/admin/about"]

const urlSchema = z.union([z.string().url("Enter a valid image URL"), z.null()])

function revalidatePublicSite() {
  revalidatePublicLayoutData()

  for (const path of ADMIN_PATHS) {
    revalidatePath(path)
  }

  for (const path of PUBLIC_PATHS) {
    revalidatePath(path, "layout")
  }
}

async function mergeSiteSettings(
  supabase: Awaited<ReturnType<typeof getAdminMutationClient>>,
  patch: Record<string, unknown>
) {
  const { data: existing } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "site_settings")
    .maybeSingle()

  const current =
    typeof existing?.value === "object" && existing.value ? existing.value : {}

  const { error } = await supabase.from("settings").upsert(
    {
      key: "site_settings",
      value: { ...current, ...patch },
    },
    { onConflict: "key" }
  )

  return error
}

export async function updateOwnerAvatar(url: string | null): Promise<ActionResult> {
  const parsed = urlSchema.safeParse(url)

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid avatar URL")
  }

  const supabase = await getAdminMutationClient()
  const error = await mergeSiteSettings(supabase, { owner_avatar: parsed.data })

  if (error) {
    return actionError(error.message)
  }

  revalidatePublicSite()
  return { success: true, data: undefined }
}

export async function updateAboutAvatar(url: string | null): Promise<ActionResult> {
  const parsed = urlSchema.safeParse(url)

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid image URL")
  }

  const supabase = await getAdminMutationClient()
  const error = await mergeSiteSettings(supabase, {
    owner_avatar_about: parsed.data,
    owner_avatar_original: null,
  })

  if (error) {
    return actionError(error.message)
  }

  revalidatePublicSite()
  return { success: true, data: undefined }
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profilePersistSchema.safeParse(input)

  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const error = await mergeSiteSettings(supabase, parsed.data)

  if (error) {
    return actionError(error.message)
  }

  revalidatePublicSite()
  return { success: true, data: undefined }
}

export async function updateAbout(input: unknown): Promise<ActionResult> {
  const parsed = aboutPageFormSchema.safeParse(input)

  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const { owner_avatar_about, ...about } = parsed.data

  const supabase = await getAdminMutationClient()

  const siteError = await mergeSiteSettings(supabase, {
    owner_avatar_about,
    owner_avatar_original: null,
  })

  if (siteError) {
    return actionError(siteError.message)
  }

  const { error: aboutError } = await supabase.from("settings").upsert(
    {
      key: "about_content",
      value: about,
    },
    { onConflict: "key" }
  )

  if (aboutError) {
    return actionError(aboutError.message)
  }

  revalidatePublicSite()
  return { success: true, data: undefined }
}

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsPersistSchema.safeParse(input)

  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const { social, contact, site_url } = parsed.data

  const { data: existingRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["site_settings", "social_links", "contact_info"])

  const existingByKey = Object.fromEntries(
    (existingRows ?? []).map((row) => [row.key, row.value])
  )

  const updates = [
    {
      key: "site_settings",
      value: {
        ...(typeof existingByKey.site_settings === "object" && existingByKey.site_settings
          ? existingByKey.site_settings
          : {}),
        site_url,
      },
    },
    {
      key: "social_links",
      value: {
        ...(typeof existingByKey.social_links === "object" && existingByKey.social_links
          ? existingByKey.social_links
          : {}),
        ...social,
      },
    },
    {
      key: "contact_info",
      value: {
        ...(typeof existingByKey.contact_info === "object" && existingByKey.contact_info
          ? existingByKey.contact_info
          : {}),
        ...contact,
      },
    },
  ]

  for (const row of updates) {
    const { error } = await supabase.from("settings").upsert(row, { onConflict: "key" })

    if (error) {
      return actionError(error.message)
    }
  }

  revalidatePublicSite()
  return { success: true, data: undefined }
}
