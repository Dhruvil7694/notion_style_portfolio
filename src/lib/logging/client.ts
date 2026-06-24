"use client"

/** Log client-side errors in development only; production relies on Sentry. */
export function logClientError(label: string, details?: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return
  }

  if (details !== undefined) {
    console.error(label, details)
    return
  }

  console.error(label)
}
