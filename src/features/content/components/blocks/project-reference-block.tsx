"use client"

import { useEffect, useState } from "react"

import { StatusBadge } from "@/features/admin/components/status-badge"
import { HoverCard } from "@/features/content/components/hover-card"
import { fetchProjectPreviewAction } from "@/features/content/lib/actions/project-preview"

type ProjectPreview = {
  id: string
  title: string
  summary: string
  tech_stack: string[] | null
  status: string
}

type ProjectReferenceBlockProps = {
  projectId: string
  preview?: ProjectPreview | null
}

export function ProjectReferenceBlock({
  projectId,
  preview: initialPreview,
}: ProjectReferenceBlockProps) {
  const [preview, setPreview] = useState<ProjectPreview | null>(
    initialPreview ?? null
  )
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(Boolean(initialPreview))

  useEffect(() => {
    if (initialPreview) {
      setPreview(initialPreview)
      setLoaded(true)
    }
  }, [initialPreview])

  async function loadPreview() {
    if (loaded) {
      return
    }

    const result = await fetchProjectPreviewAction(projectId)
    if (result.success) {
      setPreview(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setLoaded(true)
  }

  return (
    <HoverCard
      trigger={
        <span onMouseEnter={loadPreview}>
          {preview?.title ?? "Project reference"}
        </span>
      }
    >
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : preview ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{preview.title}</p>
            <StatusBadge value={preview.status} />
          </div>
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {preview.summary}
          </p>
          {preview.tech_stack && preview.tech_stack.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {preview.tech_stack.slice(0, 6).map((tech) => (
                <span
                  className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                  key={tech}
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Loading project…</p>
      )}
    </HoverCard>
  )
}
