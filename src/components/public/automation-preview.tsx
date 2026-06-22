import type { AutomationListItem } from "@/components/public/automation-list"
import { AutomationPreviewSection } from "@/components/public/automation-preview-section"

type AutomationPreviewProps = {
  items: AutomationListItem[]
}

export function AutomationPreview({ items }: AutomationPreviewProps) {
  return <AutomationPreviewSection items={items} />
}
