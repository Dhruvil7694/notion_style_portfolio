"use client"

import { CircleAlert, Lightbulb, type LucideIcon, TrendingUp } from "lucide-react"
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

import { caveatHandwriting } from "@/lib/fonts/caveat"
import { glassPanelClass } from "@/lib/public/glass-panel"
import {
  getProjectPreviewSections,
  type ProjectListPreviewItem,
} from "@/lib/public/project-preview-sections"
import { cn } from "@/lib/utils"

const SECTION_ICONS: Record<"Challenge" | "Approach" | "Impact", LucideIcon> = {
  Challenge: CircleAlert,
  Approach: Lightbulb,
  Impact: TrendingUp,
}

const CARD_WIDTH = 390
const VIEWPORT_PADDING = 16
const SECTION_GAP = 24
const PANEL_LEFT_OFFSET = 120
const MOBILE_BREAKPOINT = 768

type PanelPosition = {
  left: number
  top: number
  width: number
}

type ProjectPreviewPanelProps = {
  project: ProjectListPreviewItem | null
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  previewId: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function computePanelPosition(anchor: DOMRect): PanelPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const sectionCenterY = anchor.top + anchor.height / 2

  if (viewportWidth <= MOBILE_BREAKPOINT) {
    const width = viewportWidth - VIEWPORT_PADDING * 2
    const top = Math.min(anchor.bottom + SECTION_GAP, viewportHeight - VIEWPORT_PADDING)

    return {
      left: VIEWPORT_PADDING,
      top,
      width,
    }
  }

  const spaceRight = viewportWidth - anchor.right - VIEWPORT_PADDING
  const rawLeft =
    spaceRight >= CARD_WIDTH + SECTION_GAP
      ? anchor.right + SECTION_GAP
      : viewportWidth - CARD_WIDTH - VIEWPORT_PADDING

  const left = Math.max(VIEWPORT_PADDING, rawLeft - PANEL_LEFT_OFFSET)

  const top = Math.max(
    VIEWPORT_PADDING,
    Math.min(sectionCenterY, viewportHeight - VIEWPORT_PADDING)
  )

  return {
    left,
    top,
    width: CARD_WIDTH,
  }
}

export function ProjectPreviewPanel({
  project,
  anchorRef,
  open,
  previewId,
  onMouseEnter,
  onMouseLeave,
}: ProjectPreviewPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<PanelPosition>({
    left: 0,
    top: 0,
    width: CARD_WIDTH,
  })
  const positionLockedRef = useRef(false)

  const sections = project ? getProjectPreviewSections(project) : []

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    setPosition(computePanelPosition(anchor.getBoundingClientRect()))
  }, [anchorRef])

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false)
      positionLockedRef.current = false
      return
    }

    if (!positionLockedRef.current) {
      updatePosition()
      positionLockedRef.current = true
    }

    setVisible(true)
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleViewportChange() {
      updatePosition()
    }

    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [open, updatePosition])

  if (!mounted || !open || !project) {
    return null
  }

  return createPortal(
    <div className="project-preview-root">
      <div
        className={cn("project-preview-card", glassPanelClass, visible && "is-visible")}
        id={previewId}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="dialog"
        aria-label={`${project.title} preview`}
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
        }}
      >
        <div className="project-preview-card-sections">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.label]

            return (
              <div className="project-preview-card-section" key={section.label}>
                <div className="project-preview-card-label-row">
                  <Icon
                    aria-hidden
                    className="project-preview-card-label-icon"
                    strokeWidth={2}
                  />
                  <p
                    className={cn(
                      "project-preview-card-label",
                      caveatHandwriting.className
                    )}
                  >
                    {section.label}
                  </p>
                </div>
                <p className="project-preview-card-body">{section.value}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
