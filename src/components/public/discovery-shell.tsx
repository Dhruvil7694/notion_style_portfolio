"use client"

import { DiscoveryProvider } from "@/components/public/discovery-provider"
import { DockSearchProvider } from "@/components/public/dock-search-context"
import { VisitorInterestTracker } from "@/components/public/visitor-interest-tracker"

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
