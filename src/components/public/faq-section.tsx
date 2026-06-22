"use client"

import { useState } from "react"

import { captureEvent } from "@/lib/analytics/posthog-client"
import type { FaqItem } from "@/lib/knowledge/schemas"

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
              className="knowledge-faq-item"
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
                {item.question}
              </button>
              {open ? (
                <p className="knowledge-faq-answer">{item.answer}</p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
