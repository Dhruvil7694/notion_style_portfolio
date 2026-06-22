import type { ResearchListItem } from "@/components/public/research-list"
import { ResearchPreviewSection } from "@/components/public/research-preview-section"

type ResearchPreviewProps = {
  items: ResearchListItem[]
}

export function ResearchPreview({ items }: ResearchPreviewProps) {
  return <ResearchPreviewSection items={items} />
}
