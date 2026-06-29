"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { cn } from "@/shared/lib/utils"

type CollapsiblePreviewProps = {
  title?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CollapsiblePreview({
  title = "Preview",
  children,
  className,
  contentClassName,
  defaultOpen = false,
  open,
  onOpenChange,
}: CollapsiblePreviewProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen

  const setOpen = (next: boolean) => {
    if (open === undefined) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }

  return (
    <section
      aria-label={title}
      className={cn(
        "border-border bg-muted/20 overflow-hidden rounded-lg border shadow-md",
        className
      )}
    >
      <button
        aria-expanded={isOpen}
        className="hover:bg-muted/40 flex w-full items-center justify-between gap-2 p-4 text-left transition-colors"
        onClick={() => setOpen(!isOpen)}
        type="button"
      >
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen ? (
        <div
          className={cn(
            "border-border border-t px-4 pb-4 pt-3",
            contentClassName
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
