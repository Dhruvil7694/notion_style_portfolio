import Link from "next/link"

import type { AutomationListItem } from "@/components/public/automation-list"
import { buildAutomationMetadataLine } from "@/lib/public/automation-meta"

type AutomationListEntryProps = {
  item: AutomationListItem
}

export function AutomationListEntry({ item }: AutomationListEntryProps) {
  const metadata = buildAutomationMetadataLine(item)
  const href = `/automations/${item.slug}`

  return (
    <div className="automations-entry-wrap">
      <Link className="automations-entry" href={href}>
        <span className="automations-entry-title">{item.title}</span>
        <span className="automations-entry-meta">{metadata}</span>
      </Link>
    </div>
  )
}
