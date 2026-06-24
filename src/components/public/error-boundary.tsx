"use client"

import { Component, type ReactNode } from "react"

import { AdminErrorState } from "@/components/admin/admin-error-state"
import { PublicErrorState } from "@/components/public/public-error-state"
import { logClientError } from "@/lib/logging/client"

type Props = {
  children: ReactNode
  fallback?: ReactNode
  variant?: "public" | "admin"
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(
    error: Error,
    info: { componentStack: string }
  ): void {
    logClientError("[ErrorBoundary]", {
      error,
      componentStack: info.componentStack,
    })
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require("@sentry/nextjs") as {
        captureException: (e: unknown, ctx?: unknown) => void
      }
      Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
      })
    } catch {
      // Sentry not available — swallow
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      if (this.props.variant === "admin") {
        return (
          <AdminErrorState
            display={{
              title: "This section crashed",
              message:
                "Something broke while rendering this admin view. Try again or return to the dashboard.",
              canRetry: true,
            }}
            onRetry={this.handleRetry}
          />
        )
      }
      return (
        <PublicErrorState
          display={{
            title: "This section crashed",
            message:
              "Something broke while rendering this part of the page. Try again or return home.",
            canRetry: true,
          }}
          onRetry={this.handleRetry}
        />
      )
    }
    return this.props.children
  }
}
