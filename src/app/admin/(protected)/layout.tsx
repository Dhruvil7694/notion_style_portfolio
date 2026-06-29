import { AdminLayout } from "@/features/admin/components/admin-layout"
import { AdminProviders } from "@/features/admin/components/admin-providers"
import { requireAdmin } from "@/shared/lib/auth"

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <AdminProviders>
      <AdminLayout>{children}</AdminLayout>
    </AdminProviders>
  )
}
