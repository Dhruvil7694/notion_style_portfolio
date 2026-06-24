import { headers } from "next/headers"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminMainErrorBoundary } from "@/components/admin/admin-main-error-boundary"
import { AdminSidebarNav } from "@/components/admin/admin-sidebar"
import { getCurrentUser } from "@/lib/auth"

type AdminLayoutProps = {
  children: React.ReactNode
}

export async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser()
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? "/admin"
  const userEmail = user?.email ?? "Admin"

  return (
    <div className="bg-background flex min-h-full">
      <aside className="border-border bg-background hidden w-64 shrink-0 border-r md:sticky md:top-0 md:block md:h-screen">
        <AdminSidebarNav pathname={pathname} userEmail={userEmail} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader userEmail={userEmail} />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <AdminMainErrorBoundary>{children}</AdminMainErrorBoundary>
        </main>
      </div>
    </div>
  )
}
