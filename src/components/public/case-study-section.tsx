"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

type CaseStudySectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CaseStudySection({
  title,
  children,
  defaultOpen = false,
}: CaseStudySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="case-study-section">
      <button
        aria-expanded={open}
        className="case-study-section-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="case-study-section-title">{title}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "case-study-section-chevron",
            open && "case-study-section-chevron-open"
          )}
          size={16}
          strokeWidth={1.75}
        />
      </button>
      <div
        aria-hidden={!open}
        className={cn(
          "case-study-section-body-wrap",
          open && "case-study-section-body-wrap-open"
        )}
      >
        <div className="case-study-section-body">{children}</div>
      </div>
    </section>
  )
}
