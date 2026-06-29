"use client"

import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { buildProjectImpactLine } from "@/features/portfolio/lib/project-preview"
import {
  hasProjectPreview,
  type ProjectListPreviewItem,
} from "@/features/portfolio/lib/project-preview-sections"
import { ProjectIcon } from "@/shared/lib/icons/iconify"

type ProjectListEntryProps = {
  project: ProjectListPreviewItem
  previewId?: string
  previewOpen?: boolean
  onShow: () => void
  onHide: () => void
}

export function ProjectListEntry({
  project,
  previewId,
  previewOpen = false,
  onShow,
  onHide,
}: ProjectListEntryProps) {
  const href = `/projects/${project.slug}`
  const showPreview = hasProjectPreview(project)
  const impactLine = buildProjectImpactLine(project)

  return (
    <div
      className="project-entry-wrap"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onHide()
        }
      }}
      onFocus={showPreview ? onShow : undefined}
      onMouseEnter={showPreview ? onShow : undefined}
      onMouseLeave={showPreview ? onHide : undefined}
    >
      <Link
        aria-describedby={previewOpen && showPreview ? previewId : undefined}
        className="project-entry"
        href={href}
      >
        <ProjectIcon
          className="project-entry-icon"
          iconName={project.icon_name}
        />
        <span className="project-entry-content">
          <span className="project-entry-title">
            <span>{project.title}</span>
            <ArrowUpRight
              aria-hidden
              className="project-entry-title-arrow"
              strokeWidth={2}
            />
          </span>
          {impactLine ? (
            <span className="project-entry-impact">{impactLine}</span>
          ) : null}
        </span>
      </Link>
    </div>
  )
}
