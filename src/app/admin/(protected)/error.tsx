"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { AdminErrorState } from "@/components/admin/admin-error-state"

export default function AdminProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error("[AdminError]", {
      digest: error.digest,
      message: error.message,
    })
  }, [error])

  return <AdminErrorState error={error} onRetry={reset} />
}
