"use client"

type AnalyticsProviderProps = {
  children: React.ReactNode
}

// PostHog is initialized in instrumentation-client.ts for Next.js 15.3+.
// Pageviews are captured automatically via capture_pageview: "history_change".
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return <>{children}</>
}
