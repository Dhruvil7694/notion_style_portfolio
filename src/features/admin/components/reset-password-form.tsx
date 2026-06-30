"use client"

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { createClient } from "@/shared/lib/supabase/client"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle"
  )
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.")
      return
    }
    setStatus("saving")
    setErrorMsg("")

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setStatus("error")
    } else {
      setStatus("done")
      setTimeout(() => router.replace("/admin"), 1500)
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Password updated
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Redirecting to dashboard…
        </p>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-10"
            id="new-password"
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
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

      {errorMsg ? (
        <p className="text-destructive text-sm" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <Button
        className="w-full gap-2"
        disabled={status === "saving"}
        type="submit"
      >
        {status === "saving" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : null}
        {status === "saving" ? "Saving…" : "Update password"}
      </Button>
    </form>
  )
}
