import "server-only"

import { createClient } from "@supabase/supabase-js"

import { clientEnv } from "@/lib/env/client"
import { getServerEnv } from "@/lib/env/server"

/**
 * Creates a Supabase admin client with the secret key.
 *
 * Usage:
 * - Server-only privileged operations that bypass RLS
 * - Admin mutations, webhooks, background jobs
 * - NEVER import in Client Components or expose to the browser
 *
 * Requires SUPABASE_SECRET_KEY in the environment.
 *
 * @example
 * ```ts
 * import { createAdminClient } from "@/lib/supabase/admin"
 *
 * const supabase = createAdminClient()
 * ```
 */
export function createAdminClient() {
  const { SUPABASE_SECRET_KEY } = getServerEnv()

  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is required for admin Supabase operations."
    )
  }

  return createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
