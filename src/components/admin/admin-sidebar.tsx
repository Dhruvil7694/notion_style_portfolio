import Link from "next/link"

import { adminNavigation, isAdminNavActive } from "@/config/admin-navigation"
import { cn } from "@/lib/utils"

type AdminSidebarNavProps = {
  pathname: string
  userEmail: string
  onNavigate?: () => void
  className?: string
}

export function AdminSidebarNav({
  pathname,
  userEmail,
  onNavigate,
  className,
}: AdminSidebarNavProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-border border-b px-4 py-5">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Portfolio CMS
        </p>
        <p className="mt-1 text-sm font-semibold">Admin</p>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 px-3 py-4">
        {adminNavigation.map((item) => {
          const active = isAdminNavActive(pathname, item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              href={item.href}
              onClick={onNavigate}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-border mt-auto space-y-2 border-t px-3 py-4">
        <p className="text-muted-foreground truncate px-3 text-xs">{userEmail}</p>
        <Link
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex items-center rounded-lg px-3 py-2 text-sm transition-colors"
          href="/admin/logout"
          onClick={onNavigate}
        >
          Logout
        </Link>
      </div>
    </div>
  )
}
