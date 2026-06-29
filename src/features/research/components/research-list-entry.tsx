import Link from "next/link"

import { buildResearchMetadataLine } from "@/features/portfolio/lib/research-meta"
import type { ResearchListItem } from "@/features/research/components/research-list"
import { ListEntryTitle } from "@/features/site-shell/components/list-entry-title"

type ResearchListEntryProps = {
  item: ResearchListItem
}

export function ResearchListEntry({ item }: ResearchListEntryProps) {
  const metadata = buildResearchMetadataLine(item)
  const href = `/research/${item.slug}`

  return (
    <div className="research-entry-wrap">
      <Link className="research-entry" href={href}>
        <span className="research-entry-title">
          <ListEntryTitle>{item.title}</ListEntryTitle>
        </span>
        <span className="research-entry-meta">{metadata}</span>
      </Link>
    </div>
  )
}
