import Link from "next/link"

import { buildWritingMetadataLine } from "@/features/portfolio/lib/writing-meta"
import { ListEntryTitle } from "@/features/site-shell/components/list-entry-title"
import type { WritingListItem } from "@/features/writing/components/writing-list"

type WritingListEntryProps = {
  item: WritingListItem
}

export function WritingListEntry({ item }: WritingListEntryProps) {
  const metadata = buildWritingMetadataLine(item)
  const href = `/blog/${item.slug}`

  return (
    <div className="writing-entry-wrap">
      <Link className="writing-entry" href={href}>
        <span className="writing-entry-title">
          <ListEntryTitle>{item.title}</ListEntryTitle>
        </span>
        <span className="writing-entry-meta">{metadata}</span>
      </Link>
    </div>
  )
}
