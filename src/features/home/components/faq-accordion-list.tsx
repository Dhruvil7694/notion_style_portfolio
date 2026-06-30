"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import type { FaqItem } from "@/features/knowledge-base/lib/schemas"
import { captureEvent } from "@/shared/lib/analytics/posthog-client"
import { cn } from "@/shared/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"

type FaqAccordionListProps = {
  items: FaqItem[]
  pageType?: "project" | "research" | "writing" | "automation"
  slug?: string
}

export function FaqAccordionList({
  items,
  pageType,
  slug,
}: FaqAccordionListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return null
  }

  return (
    <>
      {items.map((item, index) => {
        const open = openIndex === index

        return (
          <Collapsible
            className={cn(
              "knowledge-faq-item",
              open && "knowledge-faq-item-open"
            )}
            key={`${item.question}-${index}`}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                setOpenIndex(index)

                if (pageType && slug) {
                  captureEvent("faq_expand", {
                    pageType,
                    slug,
                    question: item.question,
                  })
                }

                return
              }

              if (openIndex === index) {
                setOpenIndex(null)
              }
            }}
            open={open}
          >
            <CollapsibleTrigger className="knowledge-faq-question">
              <span className="knowledge-faq-question-text">
                {item.question}
              </span>
              <ChevronDown
                aria-hidden
                className="knowledge-faq-chevron"
                size={18}
                strokeWidth={1.75}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="knowledge-faq-answer-panel">
              <p className="knowledge-faq-answer">{item.answer}</p>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </>
  )
}
