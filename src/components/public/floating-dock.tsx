"use client"

import { Code2, FileText } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { AssistantDockButton } from "@/components/public/chat/assistant-dock-button"
import { ThemeToggle } from "@/components/public/theme-toggle"
import { featureFlags } from "@/config/feature-flags"
import {
  DOCK_NAV_ITEMS,
  DOCK_SECTION_IDS,
  type DockNavItem,
  dockSectionHref,
  isHomeScrollTarget,
  resolveDockNavActive,
  resolveDockNavHref,
} from "@/config/home-navigation"
import {
  scrollToHomeSection,
  useHomeScrollSpy,
} from "@/hooks/use-home-scroll-spy"
import type { PublicSettings } from "@/lib/public/settings"
import { glassPanelClass } from "@/lib/public/glass-panel"
import { cn } from "@/lib/utils"

const DockSearch = dynamic(
  () =>
    import("@/components/public/dock-search").then((module) => ({
      default: module.DockSearch,
    })),
  { ssr: false }
)

const AssistantPanel = dynamic(
  () =>
    import("@/components/public/chat/assistant-panel").then((module) => ({
      default: module.AssistantPanel,
    })),
  { ssr: false }
)

type UtilityItem = {
  label: string
  href: string
  icon: React.ReactNode
  external?: boolean
}

type FloatingDockProps = {
  settings: PublicSettings
  resumeAvailable: boolean
}

function DockLink({
  active,
  external,
  href,
  icon,
  label,
  onNavigate,
}: {
  active: boolean
  external?: boolean
  href: string
  icon: React.ReactNode
  label: string
  onNavigate?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  const className = cn(
    "dock-item group relative flex items-center transition-[background-color,color] duration-150 ease-out",
    active && "dock-item-active"
  )

  const content = (
    <>
      <span className="dock-item-icon">{icon}</span>
      <span className="dock-item-label">{label}</span>
    </>
  )

  if (external) {
    return (
      <a
        aria-label={label}
        className={className}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      aria-current={active ? "true" : undefined}
      aria-label={label}
      className={className}
      href={href}
      onClick={onNavigate}
    >
      {content}
    </Link>
  )
}

export function FloatingDock({ settings, resumeAvailable }: FloatingDockProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const activeSection = useHomeScrollSpy([...DOCK_SECTION_IDS], isHome)
  const iconClass = "h-[18px] w-[18px]"

  useEffect(() => {
    if (!isHome) {
      return
    }

    const hash = window.location.hash.replace("#", "")
    if (!isHomeScrollTarget(hash)) {
      return
    }

    const timeout = window.setTimeout(() => {
      scrollToHomeSection(hash)
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [isHome])

  const utilityItems: UtilityItem[] = [
    ...(settings.social.github
      ? [
          {
            label: "GitHub",
            href: settings.social.github,
            icon: <Code2 className={iconClass} />,
            external: true,
          },
        ]
      : []),
    ...(resumeAvailable
      ? [
          {
            label: "Resume",
            href: "/resume",
            icon: <FileText className={iconClass} />,
          },
        ]
      : []),
  ]

  function handleSectionNav(
    item: DockNavItem,
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    if (!isHome) {
      return
    }

    event.preventDefault()
    scrollToHomeSection(item.sectionId)
    window.history.replaceState(null, "", dockSectionHref(item.sectionId))
  }

  return (
    <div className="dock-stack hidden md:flex">
      <div className="dock-column">
        <DockSearch />
        <aside aria-label="Navigation dock" className="dock">
          <nav className={cn("dock-inner", glassPanelClass)}>
          {DOCK_NAV_ITEMS.map((item) => {
            const Icon = item.icon

            return (
              <DockLink
                active={resolveDockNavActive(item, pathname, activeSection, isHome)}
                href={resolveDockNavHref(item, isHome)}
                icon={<Icon className={iconClass} />}
                key={item.sectionId}
                label={item.label}
                onNavigate={(event) => handleSectionNav(item, event)}
              />
            )
          })}
          {utilityItems.length > 0 ? <div aria-hidden className="dock-divider" /> : null}
          {utilityItems.map((item) => (
            <DockLink
              active={pathname === item.href}
              external={item.external}
              href={item.href}
              icon={item.icon}
              key={item.href}
              label={item.label}
            />
          ))}
          <div aria-hidden className="dock-divider" />
          <ThemeToggle />
          </nav>
        </aside>
        {featureFlags.enablePortfolioAssistant ? <AssistantDockButton /> : null}
      </div>
      {featureFlags.enablePortfolioAssistant ? <AssistantPanel /> : null}
    </div>
  )
}
