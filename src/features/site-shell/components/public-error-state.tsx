"use client"

import Link from "next/link"

import {
  formatUserFacingError,
  type UserFacingErrorDisplay,
} from "@/features/portfolio/lib/user-facing-error"
import { ErrorAlert } from "@/shared/components/error-alert"
import { cn } from "@/shared/lib/utils"

type PublicErrorStateProps = {
  error?: unknown
  display?: UserFacingErrorDisplay
  onRetry?: () => void
  className?: string
  showHomeLink?: boolean
}

export function PublicErrorState({
  error,
  display,
  onRetry,
  className,
  showHomeLink = true,
}: PublicErrorStateProps) {
  const resolved = display ?? formatUserFacingError(error)

  return (
    <div
      className={cn(
        "mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-16 text-center",
        className
      )}
    >
      <div className="w-full max-w-md text-left">
        <ErrorAlert error={resolved} onRetry={onRetry} size="md" />
      </div>
      {showHomeLink ? (
        <Link className="text-primary text-sm hover:underline" href="/">
          Return home
        </Link>
      ) : null}
    </div>
  )
}
