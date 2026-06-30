import { createBrowserClient } from "@supabase/ssr"

import { clientEnv } from "@/shared/lib/env/client"

/**
 * Creates a Supabase client for browser/client components.
 *
 * Usage:
 * - Client Components that need realtime or client-side auth state
 * - Never use the secret key here
 *
 * @example
 * ```ts
 * import { createClient } from "@/shared/lib/supabase/client"
 *
 * const supabase = createClient()
 * ```
 */
export function createClient(options?: { persistSession?: boolean }) {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options?.persistSession === false
      ? { auth: { storage: window.sessionStorage } }
      : undefined
  )
}
