"use client"

import { Eye, EyeOff, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import posthog from "posthog-js"
import { useRef, useState } from "react"

import { createClient } from "@/shared/lib/supabase/client"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

// ── Forgot password modal ──────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  )
  const [errorMsg, setErrorMsg] = useState("")
  const overlayRef = useRef<HTMLDivElement>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    setErrorMsg("")

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    if (error) {
      setErrorMsg(
        "Failed to send reset email. Check the address and try again."
      )
      setStatus("error")
    } else {
      setStatus("sent")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      ref={overlayRef}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#18181b] p-6 shadow-2xl">
        <button
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground absolute right-4 top-4 transition-colors"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-1 text-base font-semibold text-white">
          Reset password
        </h2>
        <p className="mb-5 text-sm text-zinc-400">
          Enter your admin email — {"we'll"} send a password reset link.
        </p>

        {status === "sent" ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Reset link sent
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Check your inbox and follow the link to set a new password.
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleReset}>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400" htmlFor="reset-email">
                Email
              </Label>
              <Input
                autoComplete="email"
                className="border-white/10 bg-white/6 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/10"
                id="reset-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            {status === "error" ? (
              <p className="text-red-400 text-xs">{errorMsg}</p>
            ) : null}

            <Button
              className="w-full gap-2 bg-white font-medium text-zinc-900 hover:bg-zinc-100"
              disabled={status === "sending"}
              type="submit"
            >
              {status === "sending" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {status === "sending" ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Login form ─────────────────────────────────────────────────────────────

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
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

  const inputCls =
    "border-white/10 bg-white/6 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/10"
  const labelCls = "text-zinc-400 text-xs font-medium"

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label className={labelCls} htmlFor="email">
            Email
          </Label>
          <Input
            autoComplete="email"
            className={inputCls}
            id="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className={labelCls} htmlFor="password">
              Password
            </Label>
            <button
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              onClick={() => setShowForgot(true)}
              type="button"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              autoComplete="current-password"
              className={`${inputCls} pr-10`}
              id="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              onClick={() => setShowPassword((v) => !v)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {showForgot ? (
        <ForgotPasswordModal onClose={() => setShowForgot(false)} />
      ) : null}
    </>
  )
}
