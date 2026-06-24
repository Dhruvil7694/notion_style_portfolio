"use client"

import dynamic from "next/dynamic"

import { featureFlags } from "@/config/feature-flags"

import { ErrorBoundary } from "../error-boundary"
import { AssistantProvider } from "./assistant-context"

const MobileAssistantLayer = dynamic(
  () =>
    import("@/components/public/chat/mobile-assistant-layer").then(
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
