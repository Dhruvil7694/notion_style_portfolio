import Link from "next/link"

import type { ExperienceListItem } from "@/components/public/experience-list"
import {
  buildExperienceCompanyLine,
  formatExperienceDateRangeLabel,
  formatExperienceDurationCompact,
  getExperienceDurationMonths,
} from "@/lib/public/experience-duration"

type ExperienceListEntryProps = {
  item: ExperienceListItem
}

export function ExperienceListEntry({ item }: ExperienceListEntryProps) {
  const companyLine = buildExperienceCompanyLine(item)
  const durationMonths = getExperienceDurationMonths(item)
  const duration = formatExperienceDurationCompact(durationMonths)
  const dateRange = formatExperienceDateRangeLabel(item.start_date, item.end_date)
  const href = `/experience/${item.id}`

  return (
    <div className="experience-entry-wrap">
      <Link className="experience-entry" href={href}>
        <div className="experience-entry-main">
          <span className="experience-entry-title">{item.role}</span>
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
