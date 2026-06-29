"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { AdminErrorState } from "@/features/admin/components/admin-error-state"
import { logClientError } from "@/shared/lib/logging/client"

export default function AdminProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    logClientError("[AdminError]", {
      digest: error.digest,
      message: error.message,
    })
  }, [error])

  return <AdminErrorState error={error} onRetry={reset} />
}
