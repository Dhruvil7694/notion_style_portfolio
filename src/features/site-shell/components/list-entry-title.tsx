import { ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

type ListEntryTitleProps = {
  children: ReactNode
}

export function ListEntryTitle({ children }: ListEntryTitleProps) {
  return (
    <span className="list-entry-title">
      <span>{children}</span>
      <ArrowUpRight
        aria-hidden
        className="list-entry-title-arrow"
        strokeWidth={2}
      />
    </span>
  )
}
