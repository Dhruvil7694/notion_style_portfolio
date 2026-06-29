"use client"

import { ErrorBoundary } from "@/features/site-shell/components/error-boundary"

type AdminMainErrorBoundaryProps = {
  children: React.ReactNode
}

export function AdminMainErrorBoundary({
  children,
}: AdminMainErrorBoundaryProps) {
  return <ErrorBoundary variant="admin">{children}</ErrorBoundary>
}
