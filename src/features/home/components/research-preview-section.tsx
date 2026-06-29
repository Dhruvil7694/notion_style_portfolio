import { Microscope } from "lucide-react"
import Link from "next/link"

import {
  ResearchList,
  type ResearchListItem,
} from "@/features/research/components/research-list"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"

type ResearchPreviewSectionProps = {
  items: ResearchListItem[]
}

export function ResearchPreviewSection({ items }: ResearchPreviewSectionProps) {
  return (
    <section className="research-section kb-section mx-auto max-w-home px-page">
      <header className="research-section-header">
        <h2 className="research-section-title">
          <Microscope
            aria-hidden
            className="research-section-icon"
            strokeWidth={1.75}
          />
          Research
        </h2>
        <p className="research-section-description">
          Investigations, papers, and technical explorations.
        </p>
      </header>

      {items.length > 0 ? (
        <>
          <ResearchList items={items} />

          <Link className="research-section-more" href="/research">
            View all research
          </Link>
        </>
      ) : (
        <PublicEmptyState message="Research notes and papers will appear here as they are published." />
      )}
    </section>
  )
}
