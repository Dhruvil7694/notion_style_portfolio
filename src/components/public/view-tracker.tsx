"use client"

import { useEffect, useRef } from "react"

import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "@/lib/analytics/events"
import { captureEvent } from "@/lib/analytics/posthog-client"

type ViewTrackerProps<T extends AnalyticsEventName> = {
  event: T
  payload: AnalyticsEventPayload[T]
}

export function ViewTracker<T extends AnalyticsEventName>({
  event,
  payload,
}: ViewTrackerProps<T>) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    captureEvent(event, payload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
