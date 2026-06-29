import { AdminCallout, PageHeader } from "@/features/admin/components"
import { ProfileForm } from "@/features/admin/components/forms/profile-form"
import { getAdminSettings } from "@/features/admin/lib/queries"
import { parsePublicSettings } from "@/features/portfolio/lib/settings"

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
        <AdminCallout title="Unable to load profile" variant="error">
          <p>{error.message}</p>
        </AdminCallout>
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
