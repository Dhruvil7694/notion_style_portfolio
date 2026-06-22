import { formatDate } from "@/lib/utils/date"
import type { Content } from "@/types/database.helpers"

type ResearchMetadataFields = Pick<Content, "tags" | "published_at">

export function buildResearchMetadataLine(item: ResearchMetadataFields) {
  const year = item.published_at ? formatDate(item.published_at, "yyyy") : null
  const topic = item.tags?.[0] ?? "Research"

  return [year, "Paper", topic].filter(Boolean).join(" · ")
}
