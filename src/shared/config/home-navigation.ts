import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Briefcase,
  Building2,
  CircleUser,
  Layers,
  Sparkles,
} from "lucide-react"

/** Side dock scroll-spy order — matches homepage sections top to bottom. */
export const DOCK_SECTION_IDS = [
  "profile",
  "projects",
  "tech-stack",
  "ai-first",
  "knowledge",
  "experience",
] as const

export type DockSectionId = (typeof DOCK_SECTION_IDS)[number]

export type DockNavItem = {
  label: string
  sectionId: DockSectionId
  href: string
  icon: LucideIcon
}

export const DOCK_NAV_ITEMS: DockNavItem[] = [
  { label: "Profile", sectionId: "profile", href: "/", icon: CircleUser },
  {
    label: "Projects",
    sectionId: "projects",
    href: "/projects",
    icon: Briefcase,
  },
  {
    label: "Tech Stack",
    sectionId: "tech-stack",
    href: "/stack",
    icon: Layers,
  },
  {
    label: "AI First",
    sectionId: "ai-first",
    href: "/ai-first",
    icon: Sparkles,
  },
  {
    label: "Knowledge",
    sectionId: "knowledge",
    href: "/research",
    icon: BookOpen,
  },
  {
    label: "Experience",
    sectionId: "experience",
    href: "/experience",
    icon: Building2,
  },
]

/** Mobile nav — granular links to dedicated routes. */
export const MOBILE_HOME_SECTION_IDS = [
  "profile",
  "projects",
  "tech-stack",
  "ai-first",
  "research",
  "automations",
  "writing",
  "experience",
  "contact",
] as const

export type MobileSectionId = (typeof MOBILE_HOME_SECTION_IDS)[number]

export type MobileNavItem = {
  label: string
  sectionId: MobileSectionId
  href: string
}

export const PUBLIC_NAV_ITEMS: MobileNavItem[] = [
  { label: "Profile", sectionId: "profile", href: "/" },
  { label: "Projects", sectionId: "projects", href: "/projects" },
  { label: "Tech Stack", sectionId: "tech-stack", href: "/stack" },
  { label: "AI First", sectionId: "ai-first", href: "/ai-first" },
  { label: "Research", sectionId: "research", href: "/research" },
  { label: "Automations", sectionId: "automations", href: "/automations" },
  { label: "Experience", sectionId: "experience", href: "/experience" },
  { label: "Writing", sectionId: "writing", href: "/blog" },
  { label: "Contact", sectionId: "contact", href: "/contact" },
]

/** Hash targets supported on the homepage (dock sections + knowledge subsections). */
export const HOME_SCROLL_TARGET_IDS = [
  ...DOCK_SECTION_IDS,
  "research",
  "automations",
  "writing",
  "contact",
] as const

export type HomeScrollTargetId = (typeof HOME_SCROLL_TARGET_IDS)[number]

export function dockSectionHref(sectionId: DockSectionId): string {
  return `/#${sectionId}`
}

export function mobileSectionHref(sectionId: MobileSectionId): string {
  return `/#${sectionId}`
}

export function isHomeScrollTarget(value: string): value is HomeScrollTargetId {
  return (HOME_SCROLL_TARGET_IDS as readonly string[]).includes(value)
}

export function resolveDockNavHref(item: DockNavItem, isHome: boolean): string {
  return isHome ? dockSectionHref(item.sectionId) : item.href
}

export function resolveDockNavActive(
  item: DockNavItem,
  pathname: string,
  activeSection: DockSectionId,
  isHome: boolean
): boolean {
  if (isHome) {
    return activeSection === item.sectionId
  }

  if (item.href === "/") {
    return pathname === "/"
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function resolveMobileNavHref(
  item: MobileNavItem,
  isHome: boolean
): string {
  return isHome ? mobileSectionHref(item.sectionId) : item.href
}

export function resolveMobileNavActive(
  item: MobileNavItem,
  pathname: string,
  activeSection: MobileSectionId,
  isHome: boolean
): boolean {
  if (isHome) {
    return activeSection === item.sectionId
  }

  if (item.href === "/") {
    return pathname === "/"
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
