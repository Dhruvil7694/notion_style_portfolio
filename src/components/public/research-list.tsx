import { ResearchListEntry } from "@/components/public/research-list-entry"
import type { Content } from "@/types/database.helpers"

export type ResearchListItem = Pick<
  Content,
  "slug" | "title" | "excerpt" | "published_at" | "tags"
>

type ResearchListProps = {
  items: ResearchListItem[]
}

export function ResearchList({ items }: ResearchListProps) {
  return (
    <div className="research-list">
      {items.map((item) => (
        <ResearchListEntry item={item} key={item.slug} />
      ))}
    </div>
  )
}
