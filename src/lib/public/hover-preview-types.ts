import type { ReactNode } from "react"

export type HoverPreviewCardItem = {
  id: string
  title: string
  description: string
  href: string
  icon?: ReactNode
  actionLabel?: string
}
