"use client"

import { Icon } from "@iconify/react"
import { useId, useRef, useState } from "react"

import type { SkillUsageProject } from "@/features/portfolio/lib/skill-usage"
import { HoverBulletList } from "@/features/site-shell/components/hover-bullet-list"
import { useHoverPreviewDelays } from "@/features/site-shell/components/hover-preview-card"
import { cn } from "@/shared/lib/utils"

type SkillsChipProps = {
  id: string
  label: string
  icon: string
  projects: SkillUsageProject[]
}

export function SkillsChip({ label, icon, projects }: SkillsChipProps) {
  const [open, setOpen] = useState(false)
  const chipRef = useRef<HTMLLIElement>(null)
  const previewId = useId()
  const { scheduleOpen, scheduleClose, clearTimers } = useHoverPreviewDelays()

  const items = projects.map((project) => ({
    id: project.id,
    title: project.title,
    href: `/projects/${project.slug}`,
  }))

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
        aria-label={label}
        className={cn("skills-showcase-chip", open && "is-preview-open")}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            hide()
          }
        }}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={hide}
        tabIndex={0}
      >
        <Icon aria-hidden className="skills-showcase-chip-icon" icon={icon} />
      </li>

      <HoverBulletList
        anchorRef={chipRef}
        emptyMessage="Not used in a published project yet."
        items={items}
        label={label}
        onMouseEnter={keepOpen}
        onMouseLeave={hide}
        open={open}
        previewId={previewId}
      />
    </>
  )
}
