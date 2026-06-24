"use client"

import { ErrorBoundary } from "@/components/public/error-boundary"

type AdminMainErrorBoundaryProps = {
  children: React.ReactNode
}

export function AdminMainErrorBoundary({
  children,
}: AdminMainErrorBoundaryProps) {
  return <ErrorBoundary variant="admin">{children}</ErrorBoundary>
}
