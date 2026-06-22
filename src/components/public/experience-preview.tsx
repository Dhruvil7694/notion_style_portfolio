import type { ExperienceListItem } from "@/components/public/experience-list"
import { ExperiencePreviewSection } from "@/components/public/experience-preview-section"

type ExperiencePreviewProps = {
  items: ExperienceListItem[]
}

export function ExperiencePreview({ items }: ExperiencePreviewProps) {
  return <ExperiencePreviewSection items={items} />
}
