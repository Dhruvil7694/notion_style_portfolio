"use client"

import { computeContentStats } from "@/features/content/components/editor/editor-adapter"
import type { ContentDocument } from "@/features/content/lib/schema"
import { cn } from "@/shared/lib/utils"

type EditorStatsProps = {
  document: ContentDocument
  className?: string
}

export function EditorStats({ document, className }: EditorStatsProps) {
  const { words, characters, readingTimeMinutes } =
    computeContentStats(document)

  return (
    <div
      aria-label="Content statistics"
      className={cn(
        "text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs",
        className
      )}
    >
      <span>{words} words</span>
      <span>{characters} characters</span>
      <span>
        {readingTimeMinutes > 0
          ? `${readingTimeMinutes} min read`
          : "< 1 min read"}
      </span>
    </div>
  )
}
