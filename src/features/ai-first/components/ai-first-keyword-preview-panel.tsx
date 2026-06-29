"use client"

import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

import { resolveAiFirstKeywordIcon } from "@/features/ai-first/components/ai-first-keyword-icons"
import type { AiFirstKeywordDetail } from "@/features/portfolio/lib/ai-first-keyword-details"
import { glassPanelClass } from "@/features/portfolio/lib/glass-panel"
import { caveatHandwriting } from "@/shared/lib/fonts/caveat"
import { cn } from "@/shared/lib/utils"

const CARD_WIDTH = 300
const VIEWPORT_PADDING = 16
const SECTION_GAP = 10
const MOBILE_BREAKPOINT = 768

type PanelPlacement = "above" | "below"

type PanelPosition = {
  left: number
  top: number
  width: number
  placement: PanelPlacement
}

type AiFirstKeywordPreviewPanelProps = {
  detail: AiFirstKeywordDetail
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  previewId: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function computePanelPosition(anchor: DOMRect): PanelPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const anchorCenterY = anchor.top + anchor.height / 2
  const showAbove = anchorCenterY < viewportHeight / 2

  if (viewportWidth <= MOBILE_BREAKPOINT) {
    const width = viewportWidth - VIEWPORT_PADDING * 2
    const placement: PanelPlacement = showAbove ? "above" : "below"
    const top = showAbove
      ? Math.max(VIEWPORT_PADDING, anchor.top - SECTION_GAP)
      : Math.min(anchor.bottom + SECTION_GAP, viewportHeight - VIEWPORT_PADDING)

    return {
      left: VIEWPORT_PADDING,
      top,
      width,
      placement,
    }
  }

  const width = Math.min(CARD_WIDTH, viewportWidth - VIEWPORT_PADDING * 2)
  const left = Math.max(
    VIEWPORT_PADDING,
    Math.min(
      anchor.left + anchor.width / 2 - width / 2,
      viewportWidth - width - VIEWPORT_PADDING
    )
  )

  if (showAbove) {
    return {
      left,
      top: Math.max(VIEWPORT_PADDING, anchor.top - SECTION_GAP),
      width,
      placement: "above",
    }
  }

  return {
    left,
    top: Math.min(
      anchor.bottom + SECTION_GAP,
      viewportHeight - VIEWPORT_PADDING
    ),
    width,
    placement: "below",
  }
}

export function AiFirstKeywordPreviewPanel({
  detail,
  anchorRef,
  open,
  previewId,
  onMouseEnter,
  onMouseLeave,
}: AiFirstKeywordPreviewPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<PanelPosition>({
    left: 0,
    top: 0,
    width: CARD_WIDTH,
    placement: "below",
  })
  const positionLockedRef = useRef(false)
  const Icon = resolveAiFirstKeywordIcon(detail.icon)

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

  if (!mounted || !open) {
    return null
  }

  return createPortal(
    <div className="ai-first-keyword-preview-root">
      <div
        className={cn(
          "ai-first-keyword-preview-card",
          glassPanelClass,
          position.placement === "above" &&
            "ai-first-keyword-preview-card-above",
          position.placement === "below" &&
            "ai-first-keyword-preview-card-below",
          visible && "is-visible"
        )}
        id={previewId}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="dialog"
        aria-label={`${detail.label} details`}
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
        }}
      >
        <div className="ai-first-keyword-preview-label-row">
          <Icon
            aria-hidden
            className="ai-first-keyword-preview-icon"
            strokeWidth={2}
          />
          <p
            className={cn(
              "ai-first-keyword-preview-label",
              caveatHandwriting.className
            )}
          >
            {detail.label}
          </p>
        </div>
        <p className="ai-first-keyword-preview-body">{detail.description}</p>
      </div>
    </div>,
    document.body
  )
}
