"use client"

import {
  BlockRenderer,
  type ProjectPreview,
} from "@/features/content/components/block-renderer"
import type { ContentDocument } from "@/features/content/lib/schema"

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
