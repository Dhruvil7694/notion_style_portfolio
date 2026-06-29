"use client"

import Link from "next/link"
import { type RefObject, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { glassPanelClass } from "@/features/portfolio/lib/glass-panel"
import { ListEntryTitle } from "@/features/site-shell/components/list-entry-title"
import { cn } from "@/shared/lib/utils"

export type HoverBulletListItem = {
  id: string
  title: string
  href: string
}

type HoverBulletListProps = {
  anchorRef: RefObject<HTMLElement | null>
  emptyMessage?: string
  items: HoverBulletListItem[]
  label: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  open: boolean
  previewId: string
}

type TooltipPosition = {
  left: number
  top: number
}

export function HoverBulletList({
  anchorRef,
  emptyMessage = "Nothing to show yet.",
  items,
  label,
  onMouseEnter,
  onMouseLeave,
  open,
  previewId,
}: HoverBulletListProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0 })

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    function updatePosition() {
      const anchor = anchorRef.current
      const tooltip = tooltipRef.current
      if (!anchor) {
        return
      }

      const rect = anchor.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 12
      let left = rect.right + gap
      let top = rect.top + rect.height / 2

      if (tooltip) {
        const tooltipWidth = tooltip.offsetWidth
        const tooltipHeight = tooltip.offsetHeight
        const halfHeight = tooltipHeight / 2

        if (left + tooltipWidth > window.innerWidth - viewportPadding) {
          left = rect.left - gap - tooltipWidth
        }

        left = Math.max(viewportPadding, left)
        top = Math.max(
          viewportPadding + halfHeight,
          Math.min(top, window.innerHeight - viewportPadding - halfHeight)
        )
      }

      setPosition({
        left,
        top,
      })
    }

    updatePosition()
    const frame = window.requestAnimationFrame(updatePosition)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [anchorRef, open])

  if (!mounted || !open) {
    return null
  }

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn("hover-bullet-list", glassPanelClass)}
      id={previewId}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
      style={{ left: position.left, top: position.top }}
    >
      <p className="hover-bullet-list-label">{label}</p>
      {items.length > 0 ? (
        <ul className="hover-bullet-list-items">
          {items.map((item) => (
            <li key={item.id}>
              <Link className="hover-bullet-list-link" href={item.href}>
                <ListEntryTitle>{item.title}</ListEntryTitle>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hover-bullet-list-empty">{emptyMessage}</p>
      )}
    </div>,
    document.body
  )
}
