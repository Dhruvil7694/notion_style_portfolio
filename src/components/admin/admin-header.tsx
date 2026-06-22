import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"

type AdminHeaderProps = {
  userEmail: string
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <AdminMobileNav userEmail={userEmail} />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Admin
        </p>
        <p className="truncate text-sm font-medium">Portfolio CMS</p>
      </div>
    </header>
  )
}
