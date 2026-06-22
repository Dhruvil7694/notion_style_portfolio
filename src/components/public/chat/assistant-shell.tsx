"use client"

import { featureFlags } from "@/config/feature-flags"

import { ErrorBoundary } from "../error-boundary"
import { AssistantProvider } from "./assistant-context"

type AssistantShellProps = {
  children: React.ReactNode
}

export function AssistantShell({ children }: AssistantShellProps) {
  if (!featureFlags.enablePortfolioAssistant) {
    return children
  }

  return (
    <ErrorBoundary>
      <AssistantProvider>{children}</AssistantProvider>
    </ErrorBoundary>
  )
}
