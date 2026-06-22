import { formatDate } from "@/lib/utils/date"
import { estimateReadingTime } from "@/lib/utils/reading"
import type { Content } from "@/types/database.helpers"

type WritingMetadataFields = Pick<Content, "excerpt" | "published_at">

export function buildWritingMetadataLine(item: WritingMetadataFields) {
  const readTime = estimateReadingTime(item.excerpt)
  const date = item.published_at ? formatDate(item.published_at, "MMM d, yyyy") : null

  return [readTime, date].filter(Boolean).join(" · ")
}
