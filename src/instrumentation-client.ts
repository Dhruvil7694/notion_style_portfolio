import * as Sentry from "@sentry/nextjs"

import { deferIdleTask } from "@/lib/client/defer-idle"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

function initDeferredClientAnalytics(): void {
  deferIdleTask(() => {
    void import("@sentry/browser").then(({ replayIntegration }) => {
      Sentry.addIntegration(replayIntegration())
    })
  }, 5_000)

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return
  }

  deferIdleTask(() => {
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2026-01-30",
        capture_pageview: "history_change",
        capture_pageleave: true,
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      })
    })
  }, 3_500)
}

initDeferredClientAnalytics()
