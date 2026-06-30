"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import posthog from "posthog-js"
import { useState } from "react"

import { createClient } from "@/shared/lib/supabase/client"

const fieldCls =
  "w-full border-b border-white/25 bg-transparent pb-2 text-[15px] text-white placeholder:text-white/35 focus:border-white/60 focus:outline-none"
const labelCls = "text-sm font-semibold text-white"
const submitBtnCls =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3.5 text-[15px] font-medium text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_8px_24px_-6px_rgba(255,255,255,0.35)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { type: "spring" as const, stiffness: 320, damping: 32 },
}

// ── Forgot password view ───────────────────────────────────────────────────

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  )
  const [errorMsg, setErrorMsg] = useState("")

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
    <motion.div {...slide}>
      <button
        className="mb-6 flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </button>

      <h1 className="text-[2.25rem] font-semibold tracking-tight text-white">
        Reset password
      </h1>
      <p className="mt-2 text-[15px] text-white/60">
        Enter your admin email — {"we'll"} send a password reset link.
      </p>

      <div className="mt-10">
        {status === "sent" ? (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-medium text-emerald-300">
              Reset link sent
            </p>
            <p className="mt-0.5 text-xs text-white/60">
              Check your inbox and follow the link to set a new password.
            </p>
          </div>
        ) : (
          <form className="space-y-7" onSubmit={handleReset}>
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="reset-email">
                E-mail
              </label>
              <input
                autoComplete="email"
                className={fieldCls}
                id="reset-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your e-mail"
                required
                type="email"
                value={email}
              />
            </div>

            {status === "error" ? (
              <p className="text-sm text-red-400">{errorMsg}</p>
            ) : null}

            <button
              className={submitBtnCls}
              disabled={status === "sending"}
              type="submit"
            >
              {status === "sending" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  )
}

// ── Sign-in view ───────────────────────────────────────────────────────────

function SignInView({ onForgot }: { onForgot: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient({ persistSession: rememberMe })
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

  return (
    <motion.div {...slide}>
      <h1 className="whitespace-nowrap text-[2.25rem] font-semibold tracking-tight text-white">
        Welcome back, Dhruvil
      </h1>
      <p className="mt-2 text-[15px] text-white/60">
        Please enter your details.
      </p>

      <form className="mt-10 space-y-7" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="email">
            E-mail
          </label>
          <input
            autoComplete="email"
            className={fieldCls}
            id="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your e-mail"
            required
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              autoComplete="current-password"
              className={`${fieldCls} pr-8`}
              id="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 text-white/45 transition-colors hover:text-white"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              checked={rememberMe}
              className="size-4 rounded border-white/30 bg-transparent accent-white"
              onChange={(e) => setRememberMe(e.target.checked)}
              type="checkbox"
            />
            Remember me
          </label>

          <button
            className="text-sm font-medium text-white/85 transition-colors hover:text-white"
            onClick={onForgot}
            type="button"
          >
            Forgot your password?
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button className={submitBtnCls} disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSubmitting ? "Signing in…" : "Log in"}
        </button>
      </form>
    </motion.div>
  )
}

// ── Root: swaps between sign-in and forgot-password ────────────────────────

export function AdminLoginForm() {
  const [view, setView] = useState<"signin" | "forgot">("signin")

  return (
    <AnimatePresence mode="wait">
      {view === "signin" ? (
        <SignInView key="signin" onForgot={() => setView("forgot")} />
      ) : (
        <ForgotPasswordView key="forgot" onBack={() => setView("signin")} />
      )}
    </AnimatePresence>
  )
}
