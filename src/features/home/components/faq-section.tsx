"use client"

import Link from "next/link"

import { FaqAccordionList } from "@/features/home/components/faq-accordion-list"
import { sliceFaqItems } from "@/features/knowledge-base/lib/faq-pagination"
import type { FaqItem } from "@/features/knowledge-base/lib/schemas"

type FaqSectionProps = {
  items: FaqItem[]
  limit?: number
  pageType?: "project" | "research" | "writing" | "automation"
  slug?: string
  title?: string
  viewAllHref?: string
  viewAllLabel?: string
}

export function FaqSection({
  items,
  limit,
  pageType,
  slug,
  title = "FAQ",
  viewAllHref,
  viewAllLabel = "View more FAQs",
}: FaqSectionProps) {
  if (items.length === 0) {
    return null
  }

  const visibleItems = limit ? sliceFaqItems(items, limit) : items
  const showViewAll = Boolean(viewAllHref && items.length > visibleItems.length)

  return (
    <section className="knowledge-faq">
      <div className="knowledge-faq-header">
        <h2 className="knowledge-section-title">{title}</h2>
        {showViewAll ? (
          <Link className="knowledge-faq-view-all" href={viewAllHref!}>
            {viewAllLabel}
          </Link>
        ) : null}
      </div>
      <div className="knowledge-faq-shell">
        <FaqAccordionList
          items={visibleItems}
          pageType={pageType}
          slug={slug}
        />
      </div>
    </section>
  )
}
