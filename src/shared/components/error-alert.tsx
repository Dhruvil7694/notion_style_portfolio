"use client"

import { AlertCircle, RotateCcw, X } from "lucide-react"

import type { UserFacingErrorDisplay } from "@/features/portfolio/lib/user-facing-error"
import { cn } from "@/shared/lib/utils"

type ErrorAlertProps = {
  error: UserFacingErrorDisplay
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  size?: "sm" | "md"
}

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className,
  size = "sm",
}: ErrorAlertProps) {
  const isMd = size === "md"

  return (
    <div
      className={cn(
        "rounded-xl border border-red-500/25 bg-red-500/[0.06]",
        isMd ? "px-4 py-3" : "px-3 py-2.5",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          aria-hidden
          className={cn(
            "shrink-0 text-red-500/80",
            isMd ? "mt-0.5 size-4" : "mt-0.5 size-3.5"
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium text-red-600 dark:text-red-400",
              isMd ? "text-sm" : "text-[12px]"
            )}
          >
            {error.title}
          </p>
          <p
            className={cn(
              "mt-1 leading-relaxed text-muted-foreground",
              isMd ? "text-sm" : "text-[11px]"
            )}
          >
            {error.message}
          </p>
          {(error.canRetry && onRetry) || onDismiss ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {error.canRetry && onRetry ? (
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1",
                    "font-medium text-foreground",
                    "bg-background/80 ring-1 ring-border/60 transition-colors",
                    "hover:bg-muted/60",
                    isMd ? "text-sm" : "text-[11px]"
                  )}
                  onClick={onRetry}
                  type="button"
                >
                  <RotateCcw className="size-3" />
                  Try again
                </button>
              ) : null}
              {onDismiss ? (
                <button
                  className={cn(
                    "font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isMd ? "text-sm" : "text-[11px]"
                  )}
                  onClick={onDismiss}
                  type="button"
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            aria-label="Dismiss error"
            className="shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
            onClick={onDismiss}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
