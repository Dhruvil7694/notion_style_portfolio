import Link from "next/link"

import type { WritingListItem } from "@/components/public/writing-list"
import { buildWritingMetadataLine } from "@/lib/public/writing-meta"

type WritingListEntryProps = {
  item: WritingListItem
}

export function WritingListEntry({ item }: WritingListEntryProps) {
  const metadata = buildWritingMetadataLine(item)
  const href = `/blog/${item.slug}`

  return (
    <div className="writing-entry-wrap">
      <Link className="writing-entry" href={href}>
        <span className="writing-entry-title">{item.title}</span>
        <span className="writing-entry-meta">{metadata}</span>
      </Link>
    </div>
  )
}
