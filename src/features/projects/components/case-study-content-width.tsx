"use client"

import { useEffect, useRef } from "react"

type CaseStudyContentWidthProps = {
  children: React.ReactNode
}

export function CaseStudyContentWidth({
  children,
}: CaseStudyContentWidthProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const article = rootRef.current?.closest<HTMLElement>(".project-case-study")
    const title = article?.querySelector<HTMLElement>(
      ".project-case-study-title"
    )

    if (!article || !title) {
      return
    }

    const syncWidth = () => {
      const width = Math.ceil(title.getBoundingClientRect().width)

      if (width > 0) {
        article.style.setProperty("--case-study-content-width", `${width}px`)
      }
    }

    syncWidth()

    const observer = new ResizeObserver(syncWidth)
    observer.observe(title)

    return () => {
      observer.disconnect()
      article.style.removeProperty("--case-study-content-width")
    }
  }, [])

  return <div ref={rootRef}>{children}</div>
}
