"use client"

import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from "framer-motion"
import {
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import { AdminBrandMark } from "@/features/admin/components/admin-brand-mark"
import { ThemeToggle } from "@/features/site-shell/components/theme-toggle"
import {
  adminDashboardNavItem,
  type AdminNavGroup,
  adminNavGroups,
  type AdminNavItem,
  adminSettingsNavItem,
  getAdminNavGroupForPath,
  isAdminNavActive,
} from "@/shared/config/admin-navigation"
import { cn } from "@/shared/lib/utils"

// ─── animation config ─────────────────────────────────────────────────────────

const springConfig: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
  mass: 1.1,
}

// ─── types ────────────────────────────────────────────────────────────────────

type AdminSidebarNavProps = {
  pathname: string
  userEmail: string
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  className?: string
}

// ─── tooltip wrapper (simple CSS, avoids nested-interactive-element issues) ───

function SideTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="group relative flex w-full justify-center">
      {children}
      <div
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-xl backdrop-blur-2xl transition-opacity duration-150 group-hover:opacity-100"
        role="tooltip"
      >
        {label}
      </div>
    </div>
  )
}

// ─── collapsed icon button ─────────────────────────────────────────────────────

function CollapsedNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isAdminNavActive(pathname, item.href)
  const Icon = item.icon

  return (
    <SideTooltip label={item.title}>
      <Link
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex size-9 items-center justify-center rounded-md transition-colors",
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
        href={item.href}
        onClick={onNavigate}
      >
        <Icon aria-hidden className="size-[1.125rem] shrink-0" />
      </Link>
    </SideTooltip>
  )
}

// ─── collapsed group icon (triggers flyout) ────────────────────────────────────

function CollapsedGroupItem({
  group,
  pathname,
  onMouseEnter,
  onMouseLeave,
}: {
  group: AdminNavGroup
  pathname: string
  onMouseEnter: (groupId: string, rect: DOMRect) => void
  onMouseLeave: () => void
}) {
  const isGroupActive = group.items.some((item) =>
    isAdminNavActive(pathname, item.href)
  )
  const Icon = group.icon

  return (
    <div
      className="flex w-full justify-center"
      onMouseEnter={(e) =>
        onMouseEnter(
          group.id,
          (e.currentTarget as HTMLElement).getBoundingClientRect()
        )
      }
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          "flex size-9 cursor-default items-center justify-center rounded-md transition-colors",
          isGroupActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <Icon aria-hidden className="size-[1.125rem] shrink-0" />
      </div>
    </div>
  )
}

// ─── flyout panel ─────────────────────────────────────────────────────────────

function GroupFlyout({
  group,
  top,
  pathname,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  group: AdminNavGroup
  top: number
  pathname: string
  onNavigate?: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const maxTop = typeof window !== "undefined" ? window.innerHeight - 320 : top
  const clampedTop = Math.min(top, maxTop)
  const Icon = group.icon

  return (
    <motion.div
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className="fixed z-50 w-52 overflow-hidden rounded-xl border border-border bg-transparent shadow-2xl backdrop-blur-2xl"
      exit={{ opacity: 0, x: -4, scale: 0.97 }}
      initial={{ opacity: 0, x: -4, scale: 0.97 }}
      style={{ left: 56 + 10, top: clampedTop }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-3 py-3">
        <div className="flex size-6 items-center justify-center rounded-sm bg-muted">
          <Icon aria-hidden className="size-3.5 text-foreground" />
        </div>
        <p className="text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {group.title}
        </p>
      </div>

      {/* Items */}
      <div className="p-1.5">
        {group.items.map((item) => {
          const active = isAdminNavActive(pathname, item.href)
          const ItemIcon = item.icon
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "group/item flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-150",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              <ItemIcon
                aria-hidden
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground/60 group-hover/item:text-muted-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.title}</span>
              <ChevronRight
                className={cn(
                  "size-3 shrink-0 transition-all duration-150",
                  active
                    ? "translate-x-0 opacity-40 text-foreground"
                    : "translate-x-[-4px] opacity-0 text-foreground group-hover/item:translate-x-0 group-hover/item:opacity-30"
                )}
              />
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── expanded nav link ────────────────────────────────────────────────────────

function AdminNavLink({
  item,
  pathname,
  onNavigate,
  nested = false,
}: {
  item: AdminNavItem
  pathname: string
  onNavigate?: () => void
  nested?: boolean
}) {
  const active = isAdminNavActive(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md text-[0.9375rem] transition-colors",
        nested ? "px-3 py-2" : "px-3 py-2.5",
        active
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <Icon aria-hidden className="size-[1.125rem] shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  )
}

// ─── expanded nav group ────────────────────────────────────────────────────────

function AdminNavGroupSection({
  group,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  group: AdminNavGroup
  pathname: string
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const hasActiveChild = group.items.some((item) =>
    isAdminNavActive(pathname, item.href)
  )
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | "auto">("auto")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!ref) return
    const observer = new ResizeObserver(() => {
      setHeight(ref.scrollHeight)
    })
    observer.observe(ref)
    setHeight(ref.scrollHeight)
    return () => observer.disconnect()
  }, [ref])

  const titleLayoutId = mounted ? `${group.id}-title` : undefined
  const iconLayoutId = (href: string) =>
    mounted ? `${group.id}-icon-${href}` : undefined

  return (
    <MotionConfig transition={springConfig}>
      <motion.div
        animate={{ height: open ? height : "auto" }}
        className={cn(
          "cursor-pointer overflow-hidden rounded-md border",
          hasActiveChild
            ? "border-border bg-muted/40"
            : "border-transparent bg-transparent",
          open && "border-border bg-card"
        )}
      >
        <div ref={setRef}>
          <AnimatePresence
            key={open ? "expanded" : "collapsed"}
            mode="popLayout"
            propagate
          >
            {!open ? (
              <motion.button
                key="collapsed"
                aria-expanded={false}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50",
                  hasActiveChild ? "text-foreground" : "text-muted-foreground"
                )}
                exit={{ opacity: 0 }}
                onClick={onToggle}
                transition={{ duration: 0.1, ease: "easeOut" }}
                type="button"
              >
                <div className="grid grid-cols-2 gap-0.5">
                  {group.items.slice(0, 4).map((item, index) => {
                    const ItemIcon = item.icon
                    const active = isAdminNavActive(pathname, item.href)
                    return (
                      <motion.div
                        className={cn(
                          "flex size-[1.125rem] items-center justify-center rounded-sm",
                          active
                            ? "bg-foreground text-background"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                        key={`${group.id}-icon-${index}`}
                        layoutId={iconLayoutId(item.href)}
                        transition={{ ...springConfig, delay: 0.01 }}
                      >
                        <ItemIcon aria-hidden className="size-2.5 shrink-0" />
                      </motion.div>
                    )
                  })}
                </div>

                <div className="ml-1 flex flex-1 flex-col items-start justify-center">
                  <motion.span
                    className="text-[0.8125rem] font-semibold uppercase tracking-wide"
                    layout="position"
                    layoutId={titleLayoutId}
                  >
                    {group.title}
                  </motion.span>
                  <span className="text-muted-foreground text-[0.6875rem]">
                    {group.items.length} items
                  </span>
                </div>

                <ChevronRight
                  aria-hidden
                  className="text-muted-foreground size-3.5 shrink-0"
                />
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                className="flex w-full flex-col gap-1"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.01, ease: "easeOut" }}
              >
                <motion.div className="flex items-center px-2 py-1.5" layout>
                  <motion.span
                    className="text-foreground flex-1 text-[0.8125rem] font-semibold uppercase tracking-wide"
                    layout="position"
                    layoutId={titleLayoutId}
                  >
                    {group.title}
                  </motion.span>
                  <button
                    aria-label={`Collapse ${group.title}`}
                    className="text-muted-foreground hover:text-foreground bg-muted flex items-center justify-center rounded-sm p-0.5 transition-colors"
                    onClick={onToggle}
                    type="button"
                  >
                    <X aria-hidden className="size-3" />
                  </button>
                </motion.div>

                <AnimatePresence mode="popLayout">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon
                    const active = isAdminNavActive(pathname, item.href)
                    return (
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.9375rem] transition-colors",
                          active
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                        href={item.href}
                        key={item.href}
                        onClick={onNavigate}
                      >
                        <motion.div
                          className={cn(
                            "flex size-[1.125rem] shrink-0 items-center justify-center rounded-sm",
                            active
                              ? "bg-foreground text-background"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}
                          layoutId={iconLayoutId(item.href)}
                        >
                          <ItemIcon aria-hidden className="size-2.5" />
                        </motion.div>
                        <motion.span
                          animate={{ opacity: 1 }}
                          className="truncate"
                          initial={{ opacity: 0 }}
                        >
                          {item.title}
                        </motion.span>
                        <ChevronRight
                          aria-hidden
                          className="text-muted-foreground ml-auto size-3.5 shrink-0"
                        />
                      </Link>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </MotionConfig>
  )
}

// ─── main sidebar ─────────────────────────────────────────────────────────────

export function AdminSidebarNav({
  pathname,
  userEmail,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  className,
}: AdminSidebarNavProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const activeGroup = getAdminNavGroupForPath(pathname)
    return activeGroup ? new Set([activeGroup.id]) : new Set()
  })

  useEffect(() => {
    const activeGroup = getAdminNavGroupForPath(pathname)
    setOpenGroups(activeGroup ? new Set([activeGroup.id]) : new Set())
  }, [pathname])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((current) =>
      current.has(groupId) ? new Set() : new Set([groupId])
    )
  }

  // ── flyout state (collapsed mode) ─────────────────────────────────────────
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null)
  const [flyoutTop, setFlyoutTop] = useState(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openFlyout = useCallback((groupId: string, rect: DOMRect) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setFlyoutGroupId(groupId)
    setFlyoutTop(rect.top)
  }, [])

  const scheduleFlyoutClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setFlyoutGroupId(null), 120)
  }, [])

  const cancelFlyoutClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    []
  )

  const flyoutGroup = adminNavGroups.find((g) => g.id === flyoutGroupId) ?? null

  // ── collapsed sidebar ──────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <>
        <div className={cn("flex h-full flex-col items-center", className)}>
          {/* Brand + toggle */}
          <div className="border-border/60 flex h-14 w-full shrink-0 items-center justify-center border-b">
            <SideTooltip label="Expand sidebar">
              <button
                aria-label="Expand sidebar"
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted/60"
                onClick={onToggleCollapsed}
                type="button"
              >
                <PanelLeftOpen className="size-[1.125rem]" />
              </button>
            </SideTooltip>
          </div>

          {/* Icon nav */}
          <nav
            aria-label="Admin navigation"
            className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Dashboard */}
            <CollapsedNavItem
              item={adminDashboardNavItem}
              onNavigate={onNavigate}
              pathname={pathname}
            />

            <div className="my-1 w-6 border-t border-border/40" />

            {/* One icon per group — hover opens flyout */}
            {adminNavGroups.map((group) => (
              <CollapsedGroupItem
                group={group}
                key={group.id}
                onMouseEnter={openFlyout}
                onMouseLeave={scheduleFlyoutClose}
                pathname={pathname}
              />
            ))}
          </nav>

          {/* Footer icons */}
          <div className="border-border/60 flex shrink-0 flex-col items-center gap-1 border-t px-1.5 py-3">
            <CollapsedNavItem
              item={adminSettingsNavItem}
              onNavigate={onNavigate}
              pathname={pathname}
            />

            <SideTooltip label={userEmail}>
              <div className="text-muted-foreground flex size-9 items-center justify-center rounded-md">
                <User className="size-[1.125rem]" />
              </div>
            </SideTooltip>

            <ThemeToggle variant="admin-sidebar" />

            <SideTooltip label="Logout">
              <Link
                className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex size-9 items-center justify-center rounded-md transition-colors"
                href="/admin/logout"
                onClick={onNavigate}
                prefetch={false}
              >
                <LogOut aria-hidden className="size-[1.125rem]" />
              </Link>
            </SideTooltip>
          </div>
        </div>

        {/* Flyout panel — rendered outside sidebar div so it overlays content */}
        <AnimatePresence>
          {flyoutGroup ? (
            <GroupFlyout
              group={flyoutGroup}
              key={flyoutGroup.id}
              onMouseEnter={cancelFlyoutClose}
              onMouseLeave={scheduleFlyoutClose}
              onNavigate={() => {
                setFlyoutGroupId(null)
                onNavigate?.()
              }}
              pathname={pathname}
              top={flyoutTop}
            />
          ) : null}
        </AnimatePresence>
      </>
    )
  }

  // ── expanded sidebar ───────────────────────────────────────────────────────
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Brand + collapse toggle */}
      <div className="border-border/60 flex h-14 shrink-0 items-center justify-between border-b px-3">
        <AdminBrandMark />
        <button
          aria-label="Collapse sidebar"
          className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted/60"
          onClick={onToggleCollapsed}
          type="button"
        >
          <PanelLeftClose className="size-[1.125rem]" />
        </button>
      </div>

      {/* Nav */}
      <nav
        aria-label="Admin navigation"
        className="relative flex-1 overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-background to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-background to-transparent"
        />
        <div className="h-full space-y-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AdminNavLink
            item={adminDashboardNavItem}
            onNavigate={onNavigate}
            pathname={pathname}
          />

          {adminNavGroups.map((group) => (
            <AdminNavGroupSection
              group={group}
              key={group.id}
              onNavigate={onNavigate}
              onToggle={() => toggleGroup(group.id)}
              open={openGroups.has(group.id)}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>

      {/* Footer: toggle → settings → email → logout */}
      <div className="border-border/60 mt-auto shrink-0 space-y-1 border-t px-3 py-3">
        {/* Settings (moved above email) */}
        <AdminNavLink
          item={adminSettingsNavItem}
          onNavigate={onNavigate}
          pathname={pathname}
        />

        {/* Email + theme toggle */}
        <div className="flex items-center gap-1 px-3 py-1">
          <p className="text-muted-foreground flex-1 truncate text-[0.8125rem]">
            {userEmail}
          </p>
          <ThemeToggle variant="admin-sidebar" />
        </div>

        {/* Logout */}
        <Link
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.9375rem] transition-colors"
          href="/admin/logout"
          onClick={onNavigate}
          prefetch={false}
        >
          <LogOut aria-hidden className="size-[1.125rem] shrink-0" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  )
}
