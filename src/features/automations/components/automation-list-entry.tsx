import Link from "next/link"

import type { AutomationListItem } from "@/features/automations/components/automation-list"
import { buildAutomationMetadataLine } from "@/features/portfolio/lib/automation-meta"
import { ListEntryTitle } from "@/features/site-shell/components/list-entry-title"

type AutomationListEntryProps = {
  item: AutomationListItem
}

export function AutomationListEntry({ item }: AutomationListEntryProps) {
  const metadata = buildAutomationMetadataLine(item)
  const href = `/automations/${item.slug}`

  return (
    <div className="automations-entry-wrap">
      <Link className="automations-entry" href={href}>
        <span className="automations-entry-title">
          <ListEntryTitle>{item.title}</ListEntryTitle>
        </span>
        <span className="automations-entry-meta">{metadata}</span>
      </Link>
    </div>
  )
}
