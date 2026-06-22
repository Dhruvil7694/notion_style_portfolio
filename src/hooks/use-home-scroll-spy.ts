"use client"

import { useEffect, useState } from "react"

const ACTIVATION_OFFSET_RATIO = 0.32

export function useHomeScrollSpy<T extends string>(
  sectionIds: readonly T[],
  enabled: boolean
): T {
  const [activeId, setActiveId] = useState<T>(sectionIds[0] as T)

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      return
    }

    let frame = 0

    function resolveActiveSection(): T {
      const activationLine = window.innerHeight * ACTIVATION_OFFSET_RATIO
      let current = sectionIds[0] as T

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId)
        if (!element) {
          continue
        }

        const top = element.getBoundingClientRect().top
        if (top <= activationLine) {
          current = sectionId
        }
      }

      return current
    }

    function updateActiveSection() {
      frame = 0
      setActiveId(resolveActiveSection())
    }

    function handleScroll() {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(updateActiveSection)
    }

    updateActiveSection()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [enabled, sectionIds])

  return activeId
}

export function scrollToHomeSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (!element) {
    return
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" })
}
