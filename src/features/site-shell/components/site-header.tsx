"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { useAssistant } from "@/features/ai-assistant/components/assistant-context"
import { AssistantLottieIcon } from "@/features/ai-assistant/components/assistant-lottie-icon"
import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { ThemeToggle } from "@/features/site-shell/components/theme-toggle"
import {
  MOBILE_HOME_SECTION_IDS,
  mobileSectionHref,
  PUBLIC_NAV_ITEMS,
  resolveMobileNavActive,
  resolveMobileNavHref,
} from "@/shared/config/home-navigation"
import {
  scrollToHomeSection,
  useHomeScrollSpy,
} from "@/shared/hooks/use-home-scroll-spy"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"

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
                  "kb-nav-link mobile-nav-link flex min-h-[48px] items-center rounded-lg px-3 py-2.5 text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-foreground/[0.07] font-medium text-foreground"
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
        <div className="flex items-center gap-1">
          {assistantEnabled && <MobileAssistantToggle />}
          <Button
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="h-11 w-11 p-0"
            onClick={() => setOpen((v) => !v)}
            variant="ghost"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent
          className="public-site mobile-nav-sheet w-[min(300px,88vw)] gap-0 border-border bg-background pt-safe pb-safe text-foreground shadow-xl"
          showCloseButton={false}
          side="right"
        >
          <SheetHeader className="mobile-nav-sheet-header shrink-0 border-b border-border/50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-base font-semibold text-foreground">
                Navigation
              </SheetTitle>
              <SheetClose
                render={
                  <button
                    aria-label="Close navigation menu"
                    className="mobile-nav-close flex size-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-foreground outline-none hover:bg-muted/40"
                    type="button"
                  />
                }
              >
                <X className="size-5" />
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="mobile-nav-sheet-body flex-1 overflow-y-auto px-3 py-3">
            <Navigation onNavigate={() => setOpen(false)} />
            <div className="mt-4 border-t border-border/50 pt-2">
              <ThemeToggle variant="sheet" />
            </div>
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
      aria-label={isOpen ? "Close assistant" : "Open assistant"}
      aria-pressed={isOpen}
      className="mobile-assistant-toggle h-11 w-11 p-0"
      onClick={toggle}
      variant="ghost"
    >
      <AssistantLottieIcon size="header" />
    </Button>
  )
}
