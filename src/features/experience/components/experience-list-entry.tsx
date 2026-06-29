import Link from "next/link"

import type { ExperienceListItem } from "@/features/experience/components/experience-list"
import {
  buildExperienceCompanyLine,
  formatExperienceDateRangeLabel,
  formatExperienceDurationCompact,
  getExperienceDurationMonths,
} from "@/features/portfolio/lib/experience-duration"
import { ListEntryTitle } from "@/features/site-shell/components/list-entry-title"

type ExperienceListEntryProps = {
  item: ExperienceListItem
}

export function ExperienceListEntry({ item }: ExperienceListEntryProps) {
  const companyLine = buildExperienceCompanyLine(item)
  const durationMonths = getExperienceDurationMonths(item)
  const duration = formatExperienceDurationCompact(durationMonths)
  const dateRange = formatExperienceDateRangeLabel(
    item.start_date,
    item.end_date
  )
  const href = `/experience/${item.id}`

  return (
    <div className="experience-entry-wrap">
      <Link className="experience-entry" href={href}>
        <div className="experience-entry-main">
          <span className="experience-entry-title">
            <ListEntryTitle>{item.role}</ListEntryTitle>
          </span>
          <span className="experience-entry-meta">{companyLine}</span>
        </div>
        <div className="experience-entry-aside">
          <span className="experience-entry-duration">{duration}</span>
          <span className="experience-entry-dates">{dateRange}</span>
        </div>
      </Link>
    </div>
  )
}
