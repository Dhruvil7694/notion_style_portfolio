"use client"

import { DiscoveryProvider } from "@/features/discovery/components/discovery-provider"
import { DockSearchProvider } from "@/features/site-shell/components/dock-search-context"
import { VisitorInterestTracker } from "@/features/site-shell/components/visitor-interest-tracker"

type DiscoveryShellProps = {
  children: React.ReactNode
}

export function DiscoveryShell({ children }: DiscoveryShellProps) {
  return (
    <DiscoveryProvider>
      <DockSearchProvider>
        <VisitorInterestTracker />
        {children}
      </DockSearchProvider>
    </DiscoveryProvider>
  )
}
