"use server"

import { requireAdmin } from "@/shared/lib/auth"
import { createAdminClient } from "@/shared/lib/supabase/admin"

export async function getAdminMutationClient() {
  await requireAdmin()
  return createAdminClient()
}
