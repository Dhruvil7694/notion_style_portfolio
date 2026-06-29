"use client"

import type { AvatarPresence } from "@/features/site-shell/lib/presence"
import { cn } from "@/shared/lib/utils"

type AvatarActivityTooltipProps = {
  presence: AvatarPresence
  className?: string
}

type ActivityLine = {
  label: string
  value: string
}

export function AvatarActivityTooltip({
  presence,
  className,
}: AvatarActivityTooltipProps) {
  const lines: ActivityLine[] = []

  const building = presence.currentlyBuilding ?? presence.currentProject
  if (building) {
    lines.push({ label: "Currently Building", value: building })
  }

  if (presence.currentlyReading) {
    lines.push({ label: "Reading", value: presence.currentlyReading })
  }

  if (presence.nextFocus) {
    lines.push({ label: "Next Focus", value: presence.nextFocus })
  }

  if (lines.length === 0) {
    return null
  }

  return (
    <div className={cn("workspace-avatar-tooltip", className)} role="tooltip">
      {lines.map((line) => (
        <p className="workspace-avatar-tooltip-line" key={line.label}>
          <span className="workspace-avatar-tooltip-label">{line.label}</span>
          <span className="workspace-avatar-tooltip-value">{line.value}</span>
        </p>
      ))}
    </div>
  )
}
