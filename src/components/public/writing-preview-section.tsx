import { PenLine } from "lucide-react"
import Link from "next/link"

import { PublicEmptyState } from "@/components/public/empty-state"
import { WritingList,type WritingListItem } from "@/components/public/writing-list"

type WritingPreviewSectionProps = {
  items: WritingListItem[]
}

export function WritingPreviewSection({ items }: WritingPreviewSectionProps) {
  return (
    <section className="writing-section kb-section mx-auto max-w-home px-6">
      <header className="writing-section-header">
        <h2 className="writing-section-title">
          <PenLine aria-hidden className="writing-section-icon" strokeWidth={1.75} />
          Writing
        </h2>
        <p className="writing-section-description">
          Thoughts, technical notes, and learnings.
        </p>
      </header>

      {items.length > 0 ? (
        <>
          <WritingList items={items} />

          <Link className="writing-section-more" href="/blog">
            View all writing
          </Link>
        </>
      ) : (
        <PublicEmptyState message="Articles and notes will appear here as they are published." />
      )}
    </section>
  )
}
