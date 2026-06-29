"use client"

import posthog from "posthog-js"

import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "./events"

// PostHog is initialized in instrumentation-client.ts (Next.js 15.3+ pattern).
// initPostHog is kept for backward-compatibility but is now a no-op.
export function initPostHog(): void {}

export function trackEvent<T extends AnalyticsEventName>(
  event: AnalyticsEvent<T>
): void {
  if (typeof window === "undefined") return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.capture(event.name, {
    ...event.payload,
    timestamp: event.timestamp,
  })
}

export function captureEvent<T extends AnalyticsEventName>(
  name: T,
  payload: AnalyticsEventPayload[T]
): void {
  if (typeof window === "undefined") return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.capture(name, payload as Record<string, unknown>)
}
