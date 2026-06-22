import type { WritingListItem } from "@/components/public/writing-list"
import { WritingPreviewSection } from "@/components/public/writing-preview-section"

type WritingPreviewProps = {
  items: WritingListItem[]
}

export function WritingPreview({ items }: WritingPreviewProps) {
  return <WritingPreviewSection items={items} />
}
