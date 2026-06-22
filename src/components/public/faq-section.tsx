"use client"

import { useState } from "react"

import type { FaqItem } from "@/lib/knowledge/schemas"

type FaqSectionProps = {
  items: FaqItem[]
  title?: string
}

export function FaqSection({ items, title = "FAQ" }: FaqSectionProps) {
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
            <article className="knowledge-faq-item" key={`${item.question}-${index}`}>
              <button
                aria-expanded={open}
                className="knowledge-faq-question"
                onClick={() => setOpenIndex(open ? null : index)}
                type="button"
              >
                {item.question}
              </button>
              {open ? <p className="knowledge-faq-answer">{item.answer}</p> : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
