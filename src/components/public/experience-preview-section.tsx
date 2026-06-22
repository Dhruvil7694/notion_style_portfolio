import { Building2 } from "lucide-react"
import Link from "next/link"

import { PublicEmptyState } from "@/components/public/empty-state"
import type { ExperienceListItem } from "@/components/public/experience-list"
import { ExperienceList } from "@/components/public/experience-list"
import { KbSection } from "@/components/public/kb-section"

type ExperiencePreviewSectionProps = {
  items: ExperienceListItem[]
}

export function ExperiencePreviewSection({ items }: ExperiencePreviewSectionProps) {
  return (
    <KbSection
      className="experience-section experience-section-home"
      description="Roles and responsibilities."
      icon={Building2}
      id="experience"
      title="Experience"
    >
      {items.length > 0 ? (
        <>
          <ExperienceList items={items} />
          <Link className="kb-section-link experience-section-more" href="/experience">
            View full experience
          </Link>
        </>
      ) : (
        <PublicEmptyState message="Experience entries will appear here once added." />
      )}
    </KbSection>
  )
}
