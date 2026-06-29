"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import type { FaqItem } from "@/features/knowledge-base/lib/schemas"
import { captureEvent } from "@/shared/lib/analytics/posthog-client"
import { cn } from "@/shared/lib/utils"

type FaqSectionProps = {
  items: FaqItem[]
  title?: string
  pageType?: "project" | "research" | "writing" | "automation"
  slug?: string
}

export function FaqSection({
  items,
  title = "FAQ",
  pageType,
  slug,
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (items.length === 0) {
    return null
  }

  return (
    <section className="knowledge-faq">
      <h2 className="knowledge-section-title">{title}</h2>
      <div className="knowledge-faq-list">
        {items.map((item, index) => {
          const open = openIndex === index

          return (
            <article
              className={cn(
                "knowledge-faq-item",
                open && "knowledge-faq-item-open"
              )}
              key={`${item.question}-${index}`}
            >
              <button
                aria-expanded={open}
                className="knowledge-faq-question"
                onClick={() => {
                  const willOpen = !open
                  setOpenIndex(willOpen ? index : null)

                  if (willOpen && pageType && slug) {
                    captureEvent("faq_expand", {
                      pageType,
                      slug,
                      question: item.question,
                    })
                  }
                }}
                type="button"
              >
                <span className="knowledge-faq-question-text">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "knowledge-faq-chevron",
                    open && "knowledge-faq-chevron-open"
                  )}
                  size={16}
                  strokeWidth={1.75}
                />
              </button>
              <div
                aria-hidden={!open}
                className={cn(
                  "knowledge-faq-answer-wrap",
                  open && "knowledge-faq-answer-wrap-open"
                )}
              >
                <p className="knowledge-faq-answer">{item.answer}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
