"use client"

import { Component, type ReactNode } from "react"

type Props = {
  children: ReactNode
  fallback?: ReactNode
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
    console.error("[ErrorBoundary]", error, info.componentStack)
    // Report to Sentry when initialized (instrumentation-client.ts handles init)
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

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong.</p>
          <button
            className="text-sm underline underline-offset-2 hover:text-foreground"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
