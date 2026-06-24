import "server-only"

import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

import { isAdminEmail } from "@/lib/auth/admin-email"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return isAdminEmail(user?.email)
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/admin/login")
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  if (!isAdminEmail(user.email)) {
    redirect("/admin/unauthorized")
  }

  return user
}

export type AdminApiAuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403 }

export async function authorizeAdminApi(): Promise<AdminApiAuthResult> {
  const user = await getCurrentUser()

  if (!user) {
    return { ok: false, status: 401 }
  }

  if (!isAdminEmail(user.email)) {
    return { ok: false, status: 403 }
  }

  return { ok: true, user }
}
