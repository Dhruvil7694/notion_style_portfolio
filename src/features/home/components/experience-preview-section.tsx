import { Building2 } from "lucide-react"
import Link from "next/link"

import type { ExperienceListItem } from "@/features/experience/components/experience-list"
import { ExperienceList } from "@/features/experience/components/experience-list"
import { KbSection } from "@/features/knowledge-base/components/kb-section"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"

type ExperiencePreviewSectionProps = {
  items: ExperienceListItem[]
}

export function ExperiencePreviewSection({
  items,
}: ExperiencePreviewSectionProps) {
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
          <Link
            className="kb-section-link experience-section-more"
            href="/experience"
          >
            View full experience
          </Link>
        </>
      ) : (
        <PublicEmptyState message="Experience entries will appear here once added." />
      )}
    </KbSection>
  )
}
