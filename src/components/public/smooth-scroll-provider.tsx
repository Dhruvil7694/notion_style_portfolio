"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

type SmoothScrollProviderProps = {
  children: React.ReactNode
}

function debounce<T extends (...args: never[]) => void>(fn: T, waitMs: number) {
  let timeoutId: number | undefined

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      window.clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(() => {
      fn(...args)
    }, waitMs)
  }
}

type LenisInstance = {
  destroy: () => void
  resize: () => void
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname()
  const lenisRef = useRef<LenisInstance | null>(null)
  const isHome = pathname === "/"

  useEffect(() => {
    if (!isHome) {
      lenisRef.current?.destroy()
      lenisRef.current = null
      return
    }

    let cancelled = false
    let lenis: LenisInstance | null = null
    let resizeObserver: ResizeObserver | null = null
    let delayedRefresh: number | undefined

    const refreshScroll = debounce(() => {
      lenis?.resize()
    }, 200)

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) {
        return
      }

      lenis = new Lenis({
        autoRaf: true,
        autoResize: true,
        duration: 1.1,
        prevent: (node) =>
          node instanceof Element &&
          Boolean(
            node.closest(
              "[data-lenis-prevent], .dock-search-panel-scroll, .discovery-search-body, .projects-filters-submenu-scroll, .assistant-panel-scroll, .assistant-panel-footer"
            )
          ),
        smoothWheel: true,
      })

      lenisRef.current = lenis

      window.addEventListener("load", refreshScroll)

      resizeObserver = new ResizeObserver(() => {
        refreshScroll()
      })
      resizeObserver.observe(document.documentElement)

      delayedRefresh = window.setTimeout(refreshScroll, 400)
    })

    return () => {
      cancelled = true
      window.removeEventListener("load", refreshScroll)
      if (delayedRefresh) {
        window.clearTimeout(delayedRefresh)
      }
      resizeObserver?.disconnect()
      lenis?.destroy()
      lenisRef.current = null
    }
  }, [isHome])

  useEffect(() => {
    if (isHome) {
      lenisRef.current?.resize()
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [isHome, pathname])

  return children
}
