import { formatDate } from "@/shared/lib/utils/date"
import type { Content } from "@/shared/types/database.helpers"

type AutomationMetadataFields = Pick<Content, "tags" | "published_at">

export function buildAutomationMetadataLine(item: AutomationMetadataFields) {
  const year = item.published_at ? formatDate(item.published_at, "yyyy") : null
  const topic = item.tags?.[0] ?? "Workflow"

  return [year, "Automation", topic].filter(Boolean).join(" · ")
}
