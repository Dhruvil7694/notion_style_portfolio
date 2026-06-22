import Link from "next/link"

import type { ResearchListItem } from "@/components/public/research-list"
import { buildResearchMetadataLine } from "@/lib/public/research-meta"

type ResearchListEntryProps = {
  item: ResearchListItem
}

export function ResearchListEntry({ item }: ResearchListEntryProps) {
  const metadata = buildResearchMetadataLine(item)
  const href = `/research/${item.slug}`

  return (
    <div className="research-entry-wrap">
      <Link className="research-entry" href={href}>
        <span className="research-entry-title">{item.title}</span>
        <span className="research-entry-meta">{metadata}</span>
      </Link>
    </div>
  )
}
