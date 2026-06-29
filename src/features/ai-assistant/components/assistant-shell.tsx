"use client"

import dynamic from "next/dynamic"

import { ErrorBoundary } from "@/features/site-shell/components/error-boundary"
import { featureFlags } from "@/shared/config/feature-flags"

import { AssistantProvider } from "./assistant-context"

const MobileAssistantLayer = dynamic(
  () =>
    import("@/features/ai-assistant/components/mobile-assistant-layer").then(
      (module) => ({
        default: module.MobileAssistantLayer,
      })
    ),
  { ssr: false }
)

type AssistantShellProps = {
  children: React.ReactNode
}

export function AssistantShell({ children }: AssistantShellProps) {
  if (!featureFlags.enablePortfolioAssistant) {
    return children
  }

  return (
    <ErrorBoundary>
      <AssistantProvider>
        {children}
        <MobileAssistantLayer />
      </AssistantProvider>
    </ErrorBoundary>
  )
}
