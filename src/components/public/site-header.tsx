"use client"

import { Bot, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { useAssistant } from "@/components/public/chat/assistant-context"
import { ThemeToggle } from "@/components/public/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  MOBILE_HOME_SECTION_IDS,
  mobileSectionHref,
  PUBLIC_NAV_ITEMS,
  resolveMobileNavActive,
  resolveMobileNavHref,
} from "@/config/home-navigation"
import {
  scrollToHomeSection,
  useHomeScrollSpy,
} from "@/hooks/use-home-scroll-spy"
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
      <ul className="flex flex-col gap-1">
        {PUBLIC_NAV_ITEMS.map((item) => {
          const active = resolveMobileNavActive(
            item,
            pathname,
            activeSection,
            isHome
          )

          return (
            <li key={item.sectionId}>
              <Link
                aria-current={active ? "true" : undefined}
                className={cn(
                  "kb-nav-link flex min-h-[44px] items-center rounded-lg px-3 py-2",
                  active && "kb-nav-link-active"
                )}
                href={resolveMobileNavHref(item, isHome)}
                onClick={(event) => {
                  if (isHome) {
                    event.preventDefault()
                    scrollToHomeSection(item.sectionId)
                    window.history.replaceState(
                      null,
                      "",
                      mobileSectionHref(item.sectionId)
                    )
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
  assistantEnabled?: boolean
}

export function SiteHeader({ settings, assistantEnabled }: SiteHeaderProps) {
  const brandName = settings.site.owner_name || "Dhruvil Patel"
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="kb-site-header md:hidden">
      <div
        className="mx-auto flex items-center justify-between px-4 py-3"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <Link className="kb-nav-brand" href="/">
          {brandName}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="header" />
          {assistantEnabled && <MobileAssistantToggle />}
          <Button
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="size-10 p-0"
            onClick={() => setOpen((v) => !v)}
            variant="ghost"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent
          className="w-[min(280px,85vw)] pt-safe pb-safe"
          side="right"
        >
          <SheetHeader className="px-4 pb-4 pt-2">
            <SheetTitle className="text-left text-sm font-semibold">
              Navigation
            </SheetTitle>
          </SheetHeader>
          <div className="px-2">
            <Navigation onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

function MobileAssistantToggle() {
  const { open: isOpen, toggle } = useAssistant()

  return (
    <Button
      aria-label="Open assistant"
      aria-pressed={isOpen}
      className="size-10 p-0"
      onClick={toggle}
      variant="ghost"
    >
      <Bot className="size-5" />
    </Button>
  )
}
