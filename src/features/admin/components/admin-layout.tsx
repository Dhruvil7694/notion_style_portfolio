import { AdminLayoutShell } from "@/features/admin/components/admin-layout-shell"
import { AdminMainErrorBoundary } from "@/features/admin/components/admin-main-error-boundary"
import { getCurrentUser } from "@/shared/lib/auth"

type AdminLayoutProps = {
  children: React.ReactNode
}

export async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser()
  const userEmail = user?.email ?? "Admin"

  return (
    <AdminLayoutShell userEmail={userEmail}>
      <AdminMainErrorBoundary>{children}</AdminMainErrorBoundary>
    </AdminLayoutShell>
  )
}
