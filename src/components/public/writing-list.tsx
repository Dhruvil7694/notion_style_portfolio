import { WritingListEntry } from "@/components/public/writing-list-entry"
import type { Content } from "@/types/database.helpers"

export type WritingListItem = Pick<
  Content,
  "slug" | "title" | "excerpt" | "published_at" | "tags"
>

type WritingListProps = {
  items: WritingListItem[]
}

export function WritingList({ items }: WritingListProps) {
  return (
    <div className="writing-list">
      {items.map((item) => (
        <WritingListEntry item={item} key={item.slug} />
      ))}
    </div>
  )
}
