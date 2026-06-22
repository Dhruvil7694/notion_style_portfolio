"use client"

import { BlockRenderer, type ProjectPreview } from "@/components/content/block-renderer"
import type { ContentDocument } from "@/lib/content/schema"

type RichContentRendererProps = {
  blocks?: ContentDocument["blocks"]
  document?: ContentDocument
  projectPreviews?: Record<string, ProjectPreview>
  className?: string
}

export function RichContentRenderer({
  blocks,
  document,
  projectPreviews,
  className,
}: RichContentRendererProps) {
  const contentBlocks = blocks ?? document?.blocks ?? []

  return (
    <BlockRenderer
      blocks={contentBlocks}
      className={className}
      projectPreviews={projectPreviews}
    />
  )
}

export type { ProjectPreview }
