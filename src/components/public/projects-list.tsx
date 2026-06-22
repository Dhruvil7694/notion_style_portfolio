"use client"

import { type RefObject, useCallback, useEffect, useId, useRef, useState } from "react"

import { ProjectListEntry } from "@/components/public/project-list-entry"
import { ProjectPreviewPanel } from "@/components/public/project-preview-panel"
import {
  hasProjectPreview,
  type ProjectListPreviewItem,
} from "@/lib/public/project-preview-sections"

export type ProjectListItem = ProjectListPreviewItem

const OPEN_DELAY_MS = 0
const CLOSE_DELAY_MS = 120

type ProjectsListProps = {
  projects: ProjectListItem[]
  previewAnchorRef?: RefObject<HTMLElement | null>
}

export function ProjectsList({ projects, previewAnchorRef }: ProjectsListProps) {
  const previewId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveredRef = useRef(false)

  const [activeProject, setActiveProject] = useState<ProjectListItem | null>(null)
  const [open, setOpen] = useState(false)

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const showPreview = useCallback(
    (project: ProjectListItem) => {
      if (!hasProjectPreview(project)) {
        return
      }

      isHoveredRef.current = true
      clearCloseTimer()
      clearOpenTimer()
      setActiveProject(project)

      openTimerRef.current = setTimeout(() => {
        if (isHoveredRef.current) {
          setOpen(true)
        }
      }, OPEN_DELAY_MS)
    },
    [clearCloseTimer, clearOpenTimer]
  )

  const hidePreview = useCallback(() => {
    isHoveredRef.current = false
    clearOpenTimer()
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setOpen(false)
        setActiveProject(null)
      }
    }, CLOSE_DELAY_MS)
  }, [clearCloseTimer, clearOpenTimer])

  const keepPreview = useCallback(() => {
    isHoveredRef.current = true
    clearCloseTimer()
  }, [clearCloseTimer])

  useEffect(() => {
    return () => {
      clearOpenTimer()
      clearCloseTimer()
    }
  }, [clearCloseTimer, clearOpenTimer])

  const previewOpen =
    open && activeProject !== null && hasProjectPreview(activeProject)

  const anchorRef = previewAnchorRef ?? wrapRef

  return (
    <div className="projects-list-wrap" ref={wrapRef}>
      <div className="projects-list">
        {projects.map((project) => (
          <ProjectListEntry
            key={project.slug}
            onHide={hidePreview}
            onShow={() => showPreview(project)}
            previewId={previewId}
            previewOpen={previewOpen && activeProject?.slug === project.slug}
            project={project}
          />
        ))}
      </div>

      <ProjectPreviewPanel
        anchorRef={anchorRef}
        onMouseEnter={keepPreview}
        onMouseLeave={hidePreview}
        open={previewOpen}
        previewId={previewId}
        project={activeProject}
      />
    </div>
  )
}
