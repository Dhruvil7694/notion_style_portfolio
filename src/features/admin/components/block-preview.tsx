"use client"

import { CollapsiblePreview } from "@/features/admin/components/collapsible-preview"
import { RichContentRenderer } from "@/features/content/components/rich-content-renderer"
import { useProjectPreviews } from "@/features/content/components/use-project-previews"
import type { ContentBlock } from "@/features/content/lib/schema"
import { cn } from "@/shared/lib/utils"

type BlockPreviewProps = {
  blocks: ContentBlock[]
  className?: string
}

export function BlockPreview({ blocks, className }: BlockPreviewProps) {
  const projectPreviews = useProjectPreviews(blocks)

  return (
    <CollapsiblePreview
      className={cn("bg-muted/30", className)}
      title="Preview"
    >
      <RichContentRenderer blocks={blocks} projectPreviews={projectPreviews} />
    </CollapsiblePreview>
  )
}
