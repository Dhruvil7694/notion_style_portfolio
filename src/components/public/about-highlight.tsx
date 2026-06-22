import type { ReactNode } from "react"

type AboutHighlightProps = {
  children: ReactNode
}

export function AboutHighlight({ children }: AboutHighlightProps) {
  return <span className="about-highlight">{children}</span>
}
