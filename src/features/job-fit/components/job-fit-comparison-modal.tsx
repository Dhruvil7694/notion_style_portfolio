"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import type { JobFitComparisonMatrix } from "@/features/job-fit/lib/job-fit-comparison-matrix"
import { trapNestedScrollWheel } from "@/shared/lib/utils/trap-nested-scroll-wheel"

import { MatrixTable } from "./job-fit-history-matrix"

type JobFitComparisonModalProps = {
  matrix: JobFitComparisonMatrix
  onClose: () => void
}

export function JobFitComparisonModal({
  matrix,
  onClose,
}: JobFitComparisonModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="job-fit-comparison-modal-root public-site fixed inset-0 z-[100] flex flex-col bg-background text-foreground animate-in fade-in duration-150"
      data-lenis-prevent
      role="dialog"
      aria-label="Role comparison"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-3.5">
        <div>
          <p className="text-[13px] font-semibold tracking-tight text-foreground">
            Role comparison
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            {matrix.roles.length} roles · skills breakdown
          </p>
        </div>
        <button
          aria-label="Close comparison"
          className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </header>

      <div
        className="min-h-0 flex-1 overflow-auto overscroll-contain p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-lenis-prevent
        onWheel={trapNestedScrollWheel}
      >
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-border/60 bg-muted/10">
          <MatrixTable matrix={matrix} variant="fullscreen" />
        </div>
      </div>
    </div>,
    document.body
  )
}
