"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/public/theme-toggle"
import {
  MOBILE_HOME_SECTION_IDS,
  mobileSectionHref,
  PUBLIC_NAV_ITEMS,
  resolveMobileNavActive,
  resolveMobileNavHref,
} from "@/config/home-navigation"
import { scrollToHomeSection, useHomeScrollSpy } from "@/hooks/use-home-scroll-spy"
import type { PublicSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

export const NAV_ITEMS = PUBLIC_NAV_ITEMS

type NavigationProps = {
  className?: string
  onNavigate?: () => void
}

export function Navigation({ className, onNavigate }: NavigationProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const activeSection = useHomeScrollSpy([...MOBILE_HOME_SECTION_IDS], isHome)

  return (
    <nav aria-label="Main navigation" className={className}>
      <ul className="flex flex-col gap-0.5 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
        {PUBLIC_NAV_ITEMS.map((item) => {
          const active = resolveMobileNavActive(item, pathname, activeSection, isHome)

          return (
            <li key={item.sectionId}>
              <Link
                aria-current={active ? "true" : undefined}
                className={cn("kb-nav-link block py-1 md:py-0", active && "kb-nav-link-active")}
                href={resolveMobileNavHref(item, isHome)}
                onClick={(event) => {
                  if (isHome) {
                    event.preventDefault()
                    scrollToHomeSection(item.sectionId)
                    window.history.replaceState(null, "", mobileSectionHref(item.sectionId))
                  }

                  onNavigate?.()
                }}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

type SiteHeaderProps = {
  settings: PublicSettings
}

export function SiteHeader({ settings }: SiteHeaderProps) {
  const brandName = settings.site.owner_name || "Dhruvil Patel"

  return (
    <header className="kb-site-header md:hidden">
      <div className="mx-auto flex max-w-home items-center justify-between px-6 py-3">
        <Link className="kb-nav-brand" href="/">
          {brandName}
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="header" />
          <MobileNavTrigger />
        </div>
      </div>
    </header>
  )
}

function MobileNavTrigger() {
  return (
    <details className="group relative md:hidden">
      <summary className="kb-nav-link list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <div className="border-border/50 bg-background absolute top-full right-0 z-50 mt-1 w-40 border p-2">
        <Navigation
          onNavigate={() => {
            const details = document.querySelector("details.group")
            if (details instanceof HTMLDetailsElement) {
              details.open = false
            }
          }}
        />
      </div>
    </details>
  )
}
