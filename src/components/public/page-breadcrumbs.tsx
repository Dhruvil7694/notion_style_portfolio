"use client"

import { FileTextIcon, FolderIcon, HomeIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { Breadcrumb03, type BreadcrumbSegment } from "@/components/ui/breadcrumb-03"
import {
  BREADCRUMB_SEGMENT_LABELS,
  formatBreadcrumbSegment,
} from "@/lib/public/breadcrumb-config"

type PageBreadcrumbsProps = {
  currentLabel?: string
}

export function PageBreadcrumbs({ currentLabel }: PageBreadcrumbsProps) {
  const pathname = usePathname()

  if (!pathname || pathname === "/") {
    return null
  }

  const parts = pathname.split("/").filter(Boolean)
  if (parts.length === 0) {
    return null
  }

  const segments: BreadcrumbSegment[] = [{ label: "Home", href: "/", icon: HomeIcon }]

  let accumulatedPath = ""
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!
    accumulatedPath += `/${part}`
    const isLast = index === parts.length - 1
    const label =
      isLast && currentLabel
        ? currentLabel
        : BREADCRUMB_SEGMENT_LABELS[part] ?? formatBreadcrumbSegment(part)

    if (isLast) {
      segments.push({ label, icon: FileTextIcon, current: true })
    } else {
      segments.push({ label, href: accumulatedPath, icon: FolderIcon })
    }
  }

  return (
    <div className="mb-3">
      <Breadcrumb03 segments={segments} />
    </div>
  )
}
