"use client"

import { useEffect, useState } from "react"

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight

      if (docHeight <= 0) {
        setProgress(0)
        return
      }

      setProgress(Math.min(100, (scrollTop / docHeight) * 100))
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      aria-hidden
      className="bg-border fixed top-0 right-0 left-0 z-50 h-px"
    >
      <div
        className="bg-primary h-full transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
