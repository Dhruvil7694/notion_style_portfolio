"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { useCaseStudyAccordion } from "@/features/projects/components/case-study-accordion"
import { cn } from "@/shared/lib/utils"

type CaseStudySectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  index?: number
}

export function CaseStudySection({
  title,
  children,
  defaultOpen = false,
  index,
}: CaseStudySectionProps) {
  const accordion = useCaseStudyAccordion()
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const isAccordionItem = accordion != null && index !== undefined
  const open = isAccordionItem ? accordion.openIndex === index : localOpen

  const handleToggle = () => {
    if (isAccordionItem) {
      accordion.setOpenIndex(open ? null : index)
      return
    }

    setLocalOpen((value) => !value)
  }

  return (
    <section className="case-study-section">
      <button
        aria-expanded={open}
        className="case-study-section-trigger"
        onClick={handleToggle}
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
