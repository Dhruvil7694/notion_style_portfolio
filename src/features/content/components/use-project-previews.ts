"use client"

import { useEffect, useMemo, useState } from "react"

import { fetchProjectPreviewsAction } from "@/features/content/lib/actions/project-preview"
import {
  type ContentBlock,
  extractProjectIds,
} from "@/features/content/lib/schema"

import type { ProjectPreview } from "./block-renderer"

export function useProjectPreviews(blocks: ContentBlock[]) {
  const projectIds = useMemo(
    () => extractProjectIds({ version: 1, blocks }),
    [blocks]
  )
  const idsKey = projectIds.join(",")

  const [previews, setPreviews] = useState<Record<string, ProjectPreview>>({})

  useEffect(() => {
    if (projectIds.length === 0) {
      setPreviews({})
      return
    }

    let cancelled = false

    fetchProjectPreviewsAction(projectIds).then((data) => {
      if (!cancelled) {
        setPreviews(data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [idsKey, projectIds])

  return previews
}
