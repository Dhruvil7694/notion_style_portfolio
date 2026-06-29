"use client"

import { FileTextIcon, FolderIcon, LayoutDashboardIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { useAdminPageMeta } from "@/features/admin/components/admin-page-meta"
import {
  adminNavigation,
  isAdminNavActive,
} from "@/shared/config/admin-navigation"
import { Breadcrumb03, type BreadcrumbSegment } from "@/shared/ui/breadcrumb-03"

const ADMIN_SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  projects: "Projects",
  content: "Content",
  experience: "Experience",
  expertise: "Expertise",
  technologies: "Technologies",
  concepts: "Concepts",
  skills: "Skills",
  education: "Education",
  resume: "Resume",
  profile: "Profile",
  about: "About Me",
  "ai-settings": "AI Settings",
  copilot: "Copilot",
  ai: "AI Usage",
  "job-fit-analytics": "Job Fit Analytics",
  "content-health": "Content Health",
  launch: "Launch",
  system: "System",
  "launch-report": "Launch Report",
  debug: "Debug",
  sentry: "Sentry Debug",
  analytics: "Analytics Debug",
  settings: "Settings",
  new: "New",
}

function formatSegment(segment: string): string {
  return (
    ADMIN_SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )
}

function resolveSectionTitle(pathname: string): string | null {
  const match = adminNavigation.find((item) =>
    isAdminNavActive(pathname, item.href)
  )
  return match?.title ?? null
}

function resolveCurrentLabel(
  pathname: string,
  override: string | null
): string {
  if (override) {
    return override
  }

  const parts = pathname.split("/").filter(Boolean)
  const last = parts.at(-1)

  if (!last || last === "admin") {
    return "Dashboard"
  }

  if (last === "new") {
    return "New"
  }

  if (/^[0-9a-f-]{36}$/i.test(last) || /^[0-9a-f-]{8,}$/i.test(last)) {
    const parent = parts.at(-2)
    return parent ? `Edit ${formatSegment(parent).replace(/s$/, "")}` : "Edit"
  }

  return formatSegment(last)
}

export function AdminBreadcrumbs() {
  const pathname = usePathname() ?? "/admin"
  const { title: metaTitle } = useAdminPageMeta()

  if (!pathname.startsWith("/admin")) {
    return null
  }

  const parts = pathname.split("/").filter(Boolean)
  const segments: BreadcrumbSegment[] = [
    {
      label: "Admin",
      href: "/admin",
      icon: LayoutDashboardIcon,
    },
  ]

  let accumulatedPath = ""
  for (let index = 1; index < parts.length; index += 1) {
    const part = parts[index]!
    accumulatedPath += `/${part}`
    const isLast = index === parts.length - 1
    const fullPath = `/admin${accumulatedPath}`

    if (isLast) {
      segments.push({
        label: resolveCurrentLabel(pathname, metaTitle),
        icon: FileTextIcon,
        current: true,
      })
      continue
    }

    if (part === "admin") {
      continue
    }

    segments.push({
      label: formatSegment(part),
      href: fullPath,
      icon: FolderIcon,
    })
  }

  if (parts.length === 1) {
    segments.push({
      label: metaTitle ?? resolveSectionTitle(pathname) ?? "Dashboard",
      icon: FileTextIcon,
      current: true,
    })
  }

  return <Breadcrumb03 segments={segments} />
}
