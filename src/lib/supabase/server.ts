import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { clientEnv } from "@/lib/env/client"

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Usage:
 * - Read published content with RLS-aware publishable key + user session cookies
 * - Auth session refresh handled via cookie get/set
 *
 * @example
 * ```ts
 * import { createClient } from "@/lib/supabase/server"
 *
 * const supabase = await createClient()
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll can fail in Server Components; middleware handles refresh.
          }
        },
      },
    }
  )
}
