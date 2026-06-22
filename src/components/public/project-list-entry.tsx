"use client"

import Link from "next/link"

import { ProjectIcon } from "@/lib/icons/iconify"
import { buildProjectImpactLine } from "@/lib/public/project-preview"
import { hasProjectPreview, type ProjectListPreviewItem } from "@/lib/public/project-preview-sections"

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
        <ProjectIcon className="project-entry-icon" iconName={project.icon_name} />
        <span className="project-entry-content">
          <span className="project-entry-title">{project.title}</span>
          {impactLine ? <span className="project-entry-impact">{impactLine}</span> : null}
        </span>
      </Link>
    </div>
  )
}
