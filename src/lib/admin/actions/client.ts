"use server"

import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getAdminMutationClient() {
  await requireAdmin()
  return createAdminClient()
}
