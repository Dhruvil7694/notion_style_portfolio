import { PageHeader } from "@/components/admin"
import { ProfileForm } from "@/features/admin/forms/profile-form"
import { getAdminSettings } from "@/lib/admin/queries"
import { parsePublicSettings } from "@/lib/public/settings"

export const metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
}

export default async function AdminProfilePage() {
  const { data, error } = await getAdminSettings()

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="Homepage photo, name, title, and short bio."
          title="Profile"
        />
        <p className="text-destructive text-sm" role="alert">
          Unable to load profile: {error.message}
        </p>
      </div>
    )
  }

  const settings = parsePublicSettings(data ?? [])

  return (
    <div className="space-y-6">
      <PageHeader
        description="Edit the circular homepage photo, your name, title, and short bio."
        title="Profile"
      />
      <ProfileForm site={settings.site} />
    </div>
  )
}
