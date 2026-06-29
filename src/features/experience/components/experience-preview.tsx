import type { ExperienceListItem } from "@/features/experience/components/experience-list"
import { ExperiencePreviewSection } from "@/features/home/components/experience-preview-section"

type ExperiencePreviewProps = {
  items: ExperienceListItem[]
}

export function ExperiencePreview({ items }: ExperiencePreviewProps) {
  return <ExperiencePreviewSection items={items} />
}
