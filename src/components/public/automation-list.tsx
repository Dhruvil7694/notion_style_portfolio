import { AutomationListEntry } from "@/components/public/automation-list-entry"
import type { Content } from "@/types/database.helpers"

export type AutomationListItem = Pick<
  Content,
  "slug" | "title" | "excerpt" | "published_at" | "tags"
>

type AutomationListProps = {
  items: AutomationListItem[]
}

export function AutomationList({ items }: AutomationListProps) {
  return (
    <div className="automations-list">
      {items.map((item) => (
        <AutomationListEntry item={item} key={item.slug} />
      ))}
    </div>
  )
}
