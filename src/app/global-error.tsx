"use client"

import * as Sentry from "@sentry/nextjs"
import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error("[GlobalError]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          gap: "1rem",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h2>
        <p
          style={{
            color: "#a1a1aa",
            margin: 0,
            maxWidth: "32rem",
            textAlign: "center",
          }}
        >
          An unexpected error occurred. Please try again or contact support.
        </p>
        {error.digest && (
          <p style={{ color: "#52525b", fontSize: "0.75rem", margin: 0 }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            background: "#fafafa",
            border: "none",
            borderRadius: "0.375rem",
            color: "#0a0a0a",
            cursor: "pointer",
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
          }}
          type="button"
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            color: "#a1a1aa",
            fontSize: "0.875rem",
            textDecoration: "underline",
          }}
        >
          Return home
        </Link>
      </body>
    </html>
  )
}
