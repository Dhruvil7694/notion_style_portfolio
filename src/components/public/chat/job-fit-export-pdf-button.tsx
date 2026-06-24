"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"

import { ErrorAlert } from "@/components/shared/error-alert"
import { captureEvent } from "@/lib/analytics/posthog-client"
import { requestJobFitPdfExport } from "@/lib/public/job-fit-pdf-export"
import {
  formatUserFacingError,
  type UserFacingErrorDisplay,
} from "@/lib/public/user-facing-error"
import { cn } from "@/lib/utils"

type JobFitExportPdfButtonProps = {
  analysisMarkdown: string
  label?: string
  className?: string
  variant?: "default" | "icon"
}

export function JobFitExportPdfButton({
  analysisMarkdown,
  label = "Export PDF",
  className,
  variant = "default",
}: JobFitExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<UserFacingErrorDisplay | null>(null)

  async function handleExport() {
    if (isExporting) return
    setError(null)
    setIsExporting(true)

    const result = await requestJobFitPdfExport(analysisMarkdown)

    setIsExporting(false)

    if (!result.ok) {
      setError(formatUserFacingError(result.error))
      return
    }

    captureEvent("assistant_job_fit_pdf", {
      filename: result.filename,
    })
  }

  if (variant === "icon") {
    return (
      <div
        className={cn("inline-flex flex-col items-stretch gap-1.5", className)}
      >
        <button
          aria-label="Export job fit PDF"
          className="inline-flex size-5 items-center justify-center self-center rounded text-muted-foreground/40 transition-colors hover:text-foreground disabled:opacity-50"
          disabled={isExporting}
          onClick={() => void handleExport()}
          title="Export PDF"
          type="button"
        >
          {isExporting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Download className="size-3" />
          )}
        </button>
        {error ? (
          <ErrorAlert
            error={error}
            onDismiss={() => setError(null)}
            onRetry={() => void handleExport()}
            size="sm"
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5",
          "text-[11px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
          "disabled:opacity-50"
        )}
        disabled={isExporting}
        onClick={() => void handleExport()}
        type="button"
      >
        {isExporting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        {isExporting ? "Exporting…" : label}
      </button>
      {error ? (
        <ErrorAlert
          className="mt-2"
          error={error}
          onDismiss={() => setError(null)}
          onRetry={() => void handleExport()}
          size="sm"
        />
      ) : null}
    </div>
  )
}
