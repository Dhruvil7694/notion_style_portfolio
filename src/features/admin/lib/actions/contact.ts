"use server"

import { revalidatePath } from "next/cache"

import { getAdminMutationClient } from "@/features/admin/lib/actions/client"

export async function markContactReadAction(id: string): Promise<void> {
  const supabase = await getAdminMutationClient()
  await supabase
    .from("contact_submissions")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
  revalidatePath("/admin/contact")
}

export async function markContactUnreadAction(id: string): Promise<void> {
  const supabase = await getAdminMutationClient()
  await supabase
    .from("contact_submissions")
    .update({ read_at: null })
    .eq("id", id)
  revalidatePath("/admin/contact")
}

export async function deleteContactAction(id: string): Promise<void> {
  const supabase = await getAdminMutationClient()
  await supabase.from("contact_submissions").delete().eq("id", id)
  revalidatePath("/admin/contact")
}
