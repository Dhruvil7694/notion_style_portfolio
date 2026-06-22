"use client"

import { Icon } from "@iconify/react"
import { useId, useRef, useState } from "react"

import {
  HoverPreviewCard,
  type HoverPreviewCardItem,
  useHoverPreviewDelays,
} from "@/components/public/hover-preview-card"
import { ProjectIcon } from "@/lib/icons/iconify"
import { buildProjectImpactLine } from "@/lib/public/project-preview"
import type { SkillUsageProject } from "@/lib/public/skill-usage"
import { cn } from "@/lib/utils"

const PREVIEW_LIMIT = 3

type SkillsChipProps = {
  id: string
  label: string
  icon: string
  projects: SkillUsageProject[]
}

function buildSkillPreviewItems(projects: SkillUsageProject[]): HoverPreviewCardItem[] {
  return projects.slice(0, PREVIEW_LIMIT).map((project) => ({
    id: project.id,
    title: project.title,
    description: buildProjectImpactLine(project) ?? "",
    href: `/projects/${project.slug}`,
    icon: <ProjectIcon className="hover-preview-card-project-icon" iconName={project.icon_name} />,
  }))
}

export function SkillsChip({ id, label, icon, projects }: SkillsChipProps) {
  const [open, setOpen] = useState(false)
  const chipRef = useRef<HTMLLIElement>(null)
  const previewId = useId()
  const { scheduleOpen, scheduleClose, clearTimers } = useHoverPreviewDelays()

  const previewItems = buildSkillPreviewItems(projects)
  const viewAllHref = `/stack#${encodeURIComponent(id)}`
  const viewAllLabel =
    projects.length > PREVIEW_LIMIT
      ? `View all ${projects.length} projects`
      : "View full stack"

  const show = () => {
    scheduleOpen(() => setOpen(true))
  }

  const hide = () => {
    scheduleClose(() => setOpen(false))
  }

  const keepOpen = () => {
    clearTimers()
    setOpen(true)
  }

  return (
    <>
      <li
        ref={chipRef}
        aria-describedby={open ? previewId : undefined}
        className={cn("skills-showcase-chip", open && "is-preview-open")}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hide()
          }
        }}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={hide}
        tabIndex={0}
      >
        <Icon aria-hidden className="skills-showcase-chip-icon" icon={icon} />
        <span className="skills-showcase-chip-label">{label}</span>
      </li>

      <HoverPreviewCard
        anchorRef={chipRef}
        emptyMessage="Not used in a published project yet."
        items={previewItems}
        onMouseEnter={keepOpen}
        onMouseLeave={hide}
        open={open}
        previewId={previewId}
        title={`Projects using ${label}`}
        placement="above"
        viewAllHref={projects.length > 0 ? viewAllHref : undefined}
        viewAllLabel={viewAllLabel}
      />
    </>
  )
}
