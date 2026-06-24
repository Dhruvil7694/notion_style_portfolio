"use client"

import { ArrowRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
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
import type { HoverPreviewCardItem } from "@/lib/public/hover-preview-types"
import { cn } from "@/lib/utils"

export type { HoverPreviewCardItem } from "@/lib/public/hover-preview-types"

const CARD_WIDTH = 360
const VIEWPORT_PADDING = 16
const SECTION_GAP = 12
const MOBILE_BREAKPOINT = 768

type PanelPosition = {
  left: number
  top: number
  width: number
}

type HoverPreviewCardProps = {
  title: string
  items: HoverPreviewCardItem[]
  viewAllHref?: string
  viewAllLabel?: string
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  previewId: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  emptyMessage?: string
  titleIcon?: LucideIcon
  placement?: "side" | "above"
}

function computePanelPosition(
  anchor: DOMRect,
  placement: "side" | "above"
): PanelPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  if (viewportWidth <= MOBILE_BREAKPOINT) {
    const width = viewportWidth - VIEWPORT_PADDING * 2
    const top = Math.min(
      anchor.bottom + SECTION_GAP,
      viewportHeight - VIEWPORT_PADDING
    )

    return {
      left: VIEWPORT_PADDING,
      top,
      width,
    }
  }

  if (placement === "above") {
    const width = Math.min(CARD_WIDTH, viewportWidth - VIEWPORT_PADDING * 2)
    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        anchor.left + anchor.width / 2 - width / 2,
        viewportWidth - width - VIEWPORT_PADDING
      )
    )
    const top = Math.max(VIEWPORT_PADDING, anchor.top - SECTION_GAP)

    return { left, top, width }
  }

  const spaceRight = viewportWidth - anchor.right - VIEWPORT_PADDING
  const left =
    spaceRight >= CARD_WIDTH + SECTION_GAP
      ? anchor.right + SECTION_GAP
      : Math.max(VIEWPORT_PADDING, anchor.left - CARD_WIDTH - SECTION_GAP)

  const top = Math.max(
    VIEWPORT_PADDING,
    Math.min(anchor.top, viewportHeight - VIEWPORT_PADDING)
  )

  return {
    left,
    top,
    width: CARD_WIDTH,
  }
}

export function HoverPreviewCard({
  title,
  items,
  viewAllHref,
  viewAllLabel = "View all",
  anchorRef,
  open,
  previewId,
  onMouseEnter,
  onMouseLeave,
  emptyMessage = "Nothing to show yet.",
  titleIcon: TitleIcon,
  placement = "side",
}: HoverPreviewCardProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<PanelPosition>({
    left: 0,
    top: 0,
    width: CARD_WIDTH,
  })
  const positionLockedRef = useRef(false)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    setPosition(computePanelPosition(anchor.getBoundingClientRect(), placement))
  }, [anchorRef, placement])

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
    <div className="hover-preview-root">
      <div
        className={cn(
          "hover-preview-card",
          glassPanelClass,
          placement === "above" && "hover-preview-card-above",
          visible && "is-visible"
        )}
        id={previewId}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="dialog"
        aria-label={title}
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          ...(placement === "above"
            ? {
                transform: visible
                  ? "translateY(calc(-100% - 0.5rem)) scale(1)"
                  : "translateY(calc(-100% - 0.5rem)) scale(0.96)",
              }
            : {}),
        }}
      >
        <div className="hover-preview-card-header">
          {TitleIcon ? (
            <TitleIcon
              aria-hidden
              className="hover-preview-card-header-icon"
              strokeWidth={2}
            />
          ) : null}
          <p
            className={cn(
              "hover-preview-card-title",
              caveatHandwriting.className
            )}
          >
            {title}
          </p>
        </div>

        {items.length > 0 ? (
          <ul className="hover-preview-card-list">
            {items.map((item) => (
              <li className="hover-preview-card-item" key={item.id}>
                <Link className="hover-preview-card-item-link" href={item.href}>
                  <div className="hover-preview-card-item-head">
                    {item.icon ? (
                      <span className="hover-preview-card-item-icon">
                        {item.icon}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "hover-preview-card-item-title",
                        caveatHandwriting.className
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="hover-preview-card-item-description">
                      {item.description}
                    </p>
                  ) : null}
                  <span className="hover-preview-card-item-action">
                    {item.actionLabel ?? "View project"}
                    <ArrowRight
                      aria-hidden
                      className="hover-preview-card-item-action-icon"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hover-preview-card-empty">{emptyMessage}</p>
        )}

        {viewAllHref && items.length > 0 ? (
          <Link className="hover-preview-card-footer" href={viewAllHref}>
            {viewAllLabel}
          </Link>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

export function useHoverPreviewDelays() {
  const openTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleOpen = useCallback(
    (callback: () => void, delayMs = 140) => {
      clearTimers()
      openTimerRef.current = window.setTimeout(callback, delayMs)
    },
    [clearTimers]
  )

  const scheduleClose = useCallback((callback: () => void, delayMs = 120) => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    closeTimerRef.current = window.setTimeout(callback, delayMs)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  return { scheduleOpen, scheduleClose, clearTimers }
}
