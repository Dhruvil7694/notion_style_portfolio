"use client"

import { AiFirstKeywordChip } from "@/components/public/ai-first-keyword-chip"
import { AI_FIRST_KEYWORD_DETAILS } from "@/lib/public/ai-first-keyword-details"
import { cn } from "@/lib/utils"

type AiFirstKeywordsListProps = {
  ariaLabel?: string
  className?: string
}

export function AiFirstKeywordsList({
  ariaLabel = "AI-first capabilities",
  className,
}: AiFirstKeywordsListProps) {
  return (
    <ul aria-label={ariaLabel} className={cn("ai-first-keywords", className)}>
      {AI_FIRST_KEYWORD_DETAILS.map((detail) => (
        <AiFirstKeywordChip key={detail.label} label={detail.label} />
      ))}
    </ul>
  )
}
