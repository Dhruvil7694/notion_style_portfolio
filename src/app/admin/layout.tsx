import { AdminThemeScope } from "@/features/admin/components/admin-theme-scope"
import { SiteThemeProvider } from "@/features/site-shell/components/site-theme-provider"

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteThemeProvider>
      <AdminThemeScope>{children}</AdminThemeScope>
    </SiteThemeProvider>
  )
}
