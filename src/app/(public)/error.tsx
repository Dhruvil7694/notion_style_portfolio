"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { PublicErrorState } from "@/features/site-shell/components/public-error-state"

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error("[PublicError]", {
      digest: error.digest,
      message: error.message,
    })
  }, [error])

  return <PublicErrorState error={error} onRetry={reset} />
}
