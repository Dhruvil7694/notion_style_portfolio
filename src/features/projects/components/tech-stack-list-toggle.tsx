"use client"

import { List } from "lucide-react"
import { type RefObject } from "react"

import { cn } from "@/shared/lib/utils"

type TechStackListToggleProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  panelId: string
  toggleRef?: RefObject<HTMLButtonElement | null>
}

export function TechStackListToggle({
  open,
  onOpenChange,
  panelId,
  toggleRef,
}: TechStackListToggleProps) {
  return (
    <button
      aria-controls={panelId}
      aria-expanded={open}
      aria-label={open ? "Hide tech stack list" : "Show tech stack list"}
      className={cn(
        "case-study-tech-list-toggle-btn",
        open && "case-study-tech-list-toggle-btn--open"
      )}
      onClick={() => onOpenChange(!open)}
      ref={toggleRef}
      type="button"
    >
      <List aria-hidden className="case-study-tech-list-toggle-icon" />
    </button>
  )
}
