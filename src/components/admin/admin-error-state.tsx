"use client"

import Link from "next/link"

import { ErrorAlert } from "@/components/shared/error-alert"
import {
  formatUserFacingError,
  type UserFacingErrorDisplay,
} from "@/lib/public/user-facing-error"
import { cn } from "@/lib/utils"

type AdminErrorStateProps = {
  error?: unknown
  display?: UserFacingErrorDisplay
  onRetry?: () => void
  className?: string
}

export function AdminErrorState({
  error,
  display,
  onRetry,
  className,
}: AdminErrorStateProps) {
  const resolved = display ?? formatUserFacingError(error)

  return (
    <div className={cn("mx-auto max-w-lg space-y-6 py-8", className)}>
      <ErrorAlert error={resolved} onRetry={onRetry} size="md" />
      <Link
        className="text-muted-foreground inline-block text-sm hover:text-foreground hover:underline"
        href="/admin"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
