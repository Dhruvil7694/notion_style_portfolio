import type { AutomationListItem } from "@/features/automations/components/automation-list"
import { AutomationPreviewSection } from "@/features/home/components/automation-preview-section"

type AutomationPreviewProps = {
  items: AutomationListItem[]
}

export function AutomationPreview({ items }: AutomationPreviewProps) {
  return <AutomationPreviewSection items={items} />
}
