"use client"

import { Icon } from "@iconify/react"
import Link from "next/link"
import { type RefObject, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { normalizeTechnologySlug } from "@/features/knowledge-base/lib/taxonomy"
import { resolveTechStackIcon } from "@/features/portfolio/lib/experience-tech-stack"

const VIEWPORT_PADDING = 16
const TOGGLE_GAP = 6
const MIN_RAIL_WIDTH = 200

type PanelPosition = {
  left: number
  top: number
}

type TechStackListPanelProps = {
  toggleRef: RefObject<HTMLButtonElement | null>
  id?: string
  items: string[]
  open: boolean
}

function computeRailPosition(
  toggle: HTMLElement,
  panelWidth: number
): PanelPosition | null {
  const toggleRect = toggle.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  let left = toggleRect.right + TOGGLE_GAP

  if (left + panelWidth > viewportWidth - VIEWPORT_PADDING) {
    left = Math.max(
      VIEWPORT_PADDING,
      viewportWidth - panelWidth - VIEWPORT_PADDING
    )
  }

  return {
    left,
    top: toggleRect.top,
  }
}

export function TechStackListPanel({
  toggleRef,
  id,
  items,
  open,
}: TechStackListPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [position, setPosition] = useState<PanelPosition | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }

    const toggle = toggleRef.current
    if (!toggle) {
      return
    }

    const syncPosition = () => {
      const panelWidth = panelRef.current?.offsetWidth ?? MIN_RAIL_WIDTH
      setPosition(computeRailPosition(toggle, panelWidth))
    }

    syncPosition()

    const frame = window.requestAnimationFrame(syncPosition)

    window.addEventListener("resize", syncPosition)
    window.addEventListener("scroll", syncPosition, {
      capture: true,
      passive: true,
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", syncPosition)
      window.removeEventListener("scroll", syncPosition, true)
    }
  }, [toggleRef, items, open])

  if (!open || items.length === 0 || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="case-study-tech-list-root">
      <aside
        aria-label="Technologies used"
        className="case-study-tech-list-panel case-study-tech-list-panel--rail"
        id={id}
        ref={panelRef}
        style={
          position
            ? {
                left: position.left,
                position: "fixed",
                top: position.top,
                visibility: "visible",
              }
            : { position: "fixed", visibility: "hidden" }
        }
      >
        <ul className="case-study-tech-list-panel-list">
          {items.map((item) => {
            const href = `/technology/${normalizeTechnologySlug(item)}`

            return (
              <li className="case-study-tech-list-panel-item" key={item}>
                <Link className="case-study-tech-list-panel-link" href={href}>
                  <Icon
                    aria-hidden
                    className="case-study-tech-list-panel-link-icon"
                    icon={resolveTechStackIcon(item)}
                  />
                  <span className="case-study-tech-list-panel-link-label">
                    {item}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>,
    document.body
  )
}
