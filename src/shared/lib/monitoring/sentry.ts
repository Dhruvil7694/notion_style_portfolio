import "server-only"

import type { SeverityLevel } from "@sentry/nextjs"

export type SentryContext = Record<string, unknown>

function isEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN)
}

export function captureException(err: unknown, context?: SentryContext): void {
  if (!isEnabled()) return
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
  context?: SentryContext
): void {
  if (!isEnabled()) return
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

export function setUser(id: string, email: string, role: string): void {
  if (!isEnabled()) return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  Sentry.setUser({ id, email, role })
}

export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category?: string
): void {
  if (!isEnabled()) return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require("@sentry/nextjs")
  Sentry.addBreadcrumb({ message, data, category: category ?? "app" })
}
