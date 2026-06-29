"use client"

import { type ReactNode, useEffect } from "react"

type ClickRippleProviderProps = {
  children: ReactNode
}

const RIPPLE_DURATION_MS = 620
const RIPPLE_SIZE_PX = 14

export function ClickRippleProvider({ children }: ClickRippleProviderProps) {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return
      }

      if (reducedMotion.matches) {
        return
      }

      const ripple = document.createElement("span")
      ripple.className = "click-ripple"
      ripple.style.left = `${event.clientX}px`
      ripple.style.top = `${event.clientY}px`
      ripple.style.width = `${RIPPLE_SIZE_PX}px`
      ripple.style.height = `${RIPPLE_SIZE_PX}px`

      document.body.appendChild(ripple)

      const cleanup = () => {
        ripple.remove()
      }

      ripple.addEventListener("animationend", cleanup, { once: true })
      window.setTimeout(cleanup, RIPPLE_DURATION_MS + 80)
    }

    document.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    })

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  return children
}
