import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  streamGenAiSpans: true,
  enableLogs: true,

  integrations: [Sentry.vercelAIIntegration()],
})
