import { PageHeader } from "@/features/admin/components"
import { AdminAppearanceSettings } from "@/features/admin/components/admin-appearance-settings"
import { SettingsForm } from "@/features/admin/components/forms/settings-form"
import { getAdminSettings } from "@/features/admin/lib/queries"
import { parsePublicSettings } from "@/features/portfolio/lib/settings"

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
}

export default async function AdminSettingsPage() {
  const { data, error } = await getAdminSettings()

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="Social links, contact details, and site URL."
          title="Settings"
        />
        <p className="text-destructive text-sm" role="alert">
          Unable to load settings: {error.message}
        </p>
      </div>
    )
  }

  const settings = parsePublicSettings(data ?? [])

  return (
    <div className="space-y-6">
      <PageHeader
        description="Social links, contact details, appearance, and site URL."
        title="Settings"
      />
      <AdminAppearanceSettings />
      <SettingsForm settings={settings} />
    </div>
  )
}
