import { AdminMobileNav } from "@/features/admin/components/admin-mobile-nav"

type AdminHeaderProps = {
  userEmail: string
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <AdminMobileNav userEmail={userEmail} />
    </header>
  )
}
