import { createBrowserClient } from "@supabase/ssr"

import { clientEnv } from "@/lib/env/client"

/**
 * Creates a Supabase client for browser/client components.
 *
 * Usage:
 * - Client Components that need realtime or client-side auth state
 * - Never use the secret key here
 *
 * @example
 * ```ts
 * import { createClient } from "@/lib/supabase/client"
 *
 * const supabase = createClient()
 * ```
 */
export function createClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}
