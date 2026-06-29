import "server-only"

import { createClient } from "@supabase/supabase-js"

import { clientEnv } from "@/shared/lib/env/client"

/** Read-only Supabase client for public data — no cookies, safe inside `unstable_cache`. */
export function createPublicReadClient() {
  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}
