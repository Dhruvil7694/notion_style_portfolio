"use client"

import { RichContentRenderer } from "@/components/content/rich-content-renderer"
import { useProjectPreviews } from "@/components/content/use-project-previews"
import type { ContentBlock } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

type BlockPreviewProps = {
  blocks: ContentBlock[]
  className?: string
}

export function BlockPreview({ blocks, className }: BlockPreviewProps) {
  const projectPreviews = useProjectPreviews(blocks)

  return (
    <section
      aria-label="Content preview"
      className={cn(
        "border-border bg-muted/30 rounded-lg border p-4",
        className
      )}
    >
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        Preview
      </p>
      <RichContentRenderer blocks={blocks} projectPreviews={projectPreviews} />
    </section>
  )
}
