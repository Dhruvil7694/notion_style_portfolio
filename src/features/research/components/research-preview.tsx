import { ResearchPreviewSection } from "@/features/home/components/research-preview-section"
import type { ResearchListItem } from "@/features/research/components/research-list"

type ResearchPreviewProps = {
  items: ResearchListItem[]
}

export function ResearchPreview({ items }: ResearchPreviewProps) {
  return <ResearchPreviewSection items={items} />
}
