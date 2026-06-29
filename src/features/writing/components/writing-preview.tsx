import { WritingPreviewSection } from "@/features/home/components/writing-preview-section"
import type { WritingListItem } from "@/features/writing/components/writing-list"

type WritingPreviewProps = {
  items: WritingListItem[]
}

export function WritingPreview({ items }: WritingPreviewProps) {
  return <WritingPreviewSection items={items} />
}
