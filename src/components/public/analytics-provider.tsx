"use client"

import { useEffect } from "react"

import { usePathname } from "next/navigation"
import posthog from "posthog-js"

import { initPostHog } from "@/lib/analytics/posthog-client"

type AnalyticsProviderProps = {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.capture("$pageview", { $current_url: window.location.href })
  }, [pathname])

  return <>{children}</>
}
