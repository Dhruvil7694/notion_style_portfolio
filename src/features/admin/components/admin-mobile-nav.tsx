"use client"

import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { AdminSidebarNav } from "@/features/admin/components/admin-sidebar"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type AdminMobileNavProps = {
  userEmail: string
}

export function AdminMobileNav({ userEmail }: AdminMobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <Button
        aria-expanded={open}
        aria-label="Open navigation menu"
        className="md:hidden"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Menu className="size-4" />
      </Button>

      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        aria-label="Mobile admin navigation"
        className={cn(
          "admin-shell bg-background border-border/60 fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end px-3 py-3">
          <Button
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
        <AdminSidebarNav
          className="h-[calc(100%-3.5rem)]"
          collapsed={false}
          onNavigate={() => setOpen(false)}
          onToggleCollapsed={() => {}}
          pathname={pathname}
          userEmail={userEmail}
        />
      </aside>
    </>
  )
}
