"use client"

import { useRouter } from "next/navigation"
import posthog from "posthog-js"
import { useState } from "react"

import { createClient } from "@/shared/lib/supabase/client"
import { Button } from "@/shared/ui/button"

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (signInError) {
      // Strip internal hostnames/URLs from error messages before showing to user
      const raw = signInError.message
      const sanitized = /invalid.login.credentials/i.test(raw)
        ? "Invalid email or password."
        : /fetch|network|failed to fetch|supabase/i.test(raw)
          ? "Unable to reach the authentication server. Check your connection and try again."
          : raw
      setError(sanitized)
      setIsSubmitting(false)
      return
    }

    const userId = signInData.user?.id ?? email
    posthog.identify(userId, { email })
    posthog.capture("admin_login", { email })

    router.replace("/admin")
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="border-input bg-background focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="border-input bg-background focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
