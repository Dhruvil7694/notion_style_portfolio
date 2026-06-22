import "server-only"

import type { SeverityLevel } from "@sentry/nextjs"

// Lazy init — only activates when SENTRY_DSN is present
let initialized = false

function ensureInit(): boolean {
  if (initialized) return true
  if (!process.env.SENTRY_DSN) return false

  // Dynamic require so bundle stays clean when DSN is absent
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    debug: false,
  })
  initialized = true
  return true
}

export type SentryContext = Record<string, unknown>

export function captureException(
  err: unknown,
  context?: SentryContext,
): void {
  if (!ensureInit()) return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  if (context) {
    Sentry.withScope((scope: ReturnType<typeof Sentry.getCurrentScope>) => {
      scope.setExtras(context)
      Sentry.captureException(err)
    })
  } else {
    Sentry.captureException(err)
  }
}

export function captureMessage(
  msg: string,
  level?: SeverityLevel,
  context?: SentryContext,
): void {
  if (!ensureInit()) return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  if (context) {
    Sentry.withScope((scope: ReturnType<typeof Sentry.getCurrentScope>) => {
      scope.setExtras(context)
      Sentry.captureMessage(msg, level ?? "info")
    })
  } else {
    Sentry.captureMessage(msg, level ?? "info")
  }
}

export function setUser(
  id: string,
  email: string,
  role: string,
): void {
  if (!ensureInit()) return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  Sentry.setUser({ id, email, role })
}

export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category?: string,
): void {
  if (!ensureInit()) return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  Sentry.addBreadcrumb({ message, data, category: category ?? "app" })
}
