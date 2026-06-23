"use client"

import dynamic from "next/dynamic"

import { featureFlags } from "@/config/feature-flags"

import { ErrorBoundary } from "../error-boundary"
import { AssistantProvider } from "./assistant-context"

const AssistantPanel = dynamic(
  () =>
    import("@/components/public/chat/assistant-panel").then((module) => ({
      default: module.AssistantPanel,
    })),
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
        {/* Mobile-only assistant panel — fixed overlay, outside the hidden dock */}
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <AssistantPanel />
        </div>
      </AssistantProvider>
    </ErrorBoundary>
  )
}
