"use client"

import { ChevronDown } from "lucide-react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import { trapNestedScrollWheel } from "@/lib/utils/trap-nested-scroll-wheel"

type ProjectsFilterSubmenuProps = {
  children: ReactNode
  menuKey: string
  onMouseEnter: () => void
}

export function ProjectsFilterSubmenu({
  children,
  menuKey,
  onMouseEnter,
}: ProjectsFilterSubmenuProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  const updateScrollHint = useCallback(() => {
    const element = scrollRef.current
    if (!element) {
      setShowScrollHint(false)
      return
    }

    const hasOverflow = element.scrollHeight > element.clientHeight + 2
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 4
    setShowScrollHint(hasOverflow && !atBottom)
  }, [])

  useEffect(() => {
    updateScrollHint()

    const element = scrollRef.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver(updateScrollHint)
    observer.observe(element)

    return () => observer.disconnect()
  }, [menuKey, updateScrollHint])

  return (
    <div className="projects-filters-submenu" onMouseEnter={onMouseEnter} role="menu">
      <div
        className="projects-filters-submenu-scroll"
        data-lenis-prevent
        onScroll={updateScrollHint}
        onWheel={trapNestedScrollWheel}
        ref={scrollRef}
      >
        {children}
      </div>
      {showScrollHint ? (
        <div aria-hidden className="projects-filters-submenu-scroll-hint">
          <div className="projects-filters-submenu-fade" />
          <ChevronDown className="projects-filters-submenu-scroll-icon" strokeWidth={2} />
        </div>
      ) : null}
    </div>
  )
}
