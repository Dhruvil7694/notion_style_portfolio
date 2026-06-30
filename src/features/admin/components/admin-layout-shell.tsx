"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { AdminBackToWebsiteButton } from "@/features/admin/components/admin-back-to-website-button"
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs"
import { AdminMobileNav } from "@/features/admin/components/admin-mobile-nav"
import { AdminPageMetaProvider } from "@/features/admin/components/admin-page-meta"
import { AdminSidebarNav } from "@/features/admin/components/admin-sidebar"
import { cn } from "@/shared/lib/utils"

const SIDEBAR_W_EXPANDED = 224 // w-56
const SIDEBAR_W_COLLAPSED = 56 // w-14
const LS_KEY = "admin-sidebar-collapsed"

const spring = { type: "spring" as const, stiffness: 280, damping: 28 }

type AdminLayoutShellProps = {
  children: React.ReactNode
  userEmail: string
}

export function AdminLayoutShell({
  children,
  userEmail,
}: AdminLayoutShellProps) {
  const pathname = usePathname() ?? "/admin"
  const isCopilot = pathname.startsWith("/admin/copilot")

  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored === "true") setCollapsed(true)
    setMounted(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(LS_KEY, String(next))
      return next
    })
  }

  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED

  return (
    <AdminPageMetaProvider>
      <div className="admin-shell bg-background h-screen overflow-hidden">
        {/* Desktop sidebar — floating */}
        <motion.aside
          animate={{ width: mounted ? sidebarW : SIDEBAR_W_EXPANDED }}
          className="border-border/60 bg-background fixed inset-y-3 left-3 z-40 hidden flex-col rounded-2xl border shadow-sm md:flex"
          initial={false}
          transition={spring}
        >
          <AdminSidebarNav
            collapsed={mounted ? collapsed : false}
            onToggleCollapsed={toggleCollapsed}
            pathname={pathname}
            userEmail={userEmail}
          />
        </motion.aside>

        {/* Main content */}
        <motion.div
          animate={{
            paddingLeft: mounted ? sidebarW + 24 : SIDEBAR_W_EXPANDED + 24,
          }}
          className="flex h-screen flex-col overflow-hidden"
          initial={false}
          transition={spring}
        >
          <header className="border-border/60 bg-background/95 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur md:px-8">
            <div className="flex w-full min-w-0 items-center gap-3">
              <AdminMobileNav userEmail={userEmail} />
              <div className="min-w-0 flex-1">
                <AdminBreadcrumbs />
              </div>
              <AdminBackToWebsiteButton className="shrink-0" />
            </div>
          </header>

          <main
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              isCopilot ? "overflow-hidden p-0" : "overflow-y-auto p-4 md:p-8"
            )}
          >
            {children}
          </main>
        </motion.div>
      </div>
    </AdminPageMetaProvider>
  )
}
