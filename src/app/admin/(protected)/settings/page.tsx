import { PageHeader } from "@/components/admin"
import { SettingsForm } from "@/features/admin/forms/settings-form"
import { getAdminSettings } from "@/lib/admin/queries"
import { parsePublicSettings } from "@/lib/public/settings"

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
        description="Social links, contact details, and site URL."
        title="Settings"
      />
      <SettingsForm settings={settings} />
    </div>
  )
}
