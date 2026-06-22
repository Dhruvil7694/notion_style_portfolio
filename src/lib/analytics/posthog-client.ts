"use client"

import posthog from "posthog-js"

import type { AnalyticsEvent, AnalyticsEventName } from "./events"

let initialized = false

export function initPostHog(): void {
  if (initialized) return
  if (typeof window === "undefined") return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // we track pageviews manually
    capture_pageleave: true,
    persistence: "localStorage",
  })

  initialized = true
}

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
