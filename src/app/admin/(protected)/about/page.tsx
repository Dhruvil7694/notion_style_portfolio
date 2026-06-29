import { AdminCallout, PageHeader } from "@/features/admin/components"
import { AboutForm } from "@/features/admin/components/forms/about-form"
import { getAdminSettings } from "@/features/admin/lib/queries"
import { parsePublicSettings } from "@/features/portfolio/lib/settings"

export const metadata = {
  title: "About Me",
  robots: { index: false, follow: false },
}

export default async function AdminAboutPage() {
  const { data, error } = await getAdminSettings()

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="About page photo and long-form copy."
          title="About Me"
        />
        <AdminCallout title="Unable to load About Me content" variant="error">
          <p>{error.message}</p>
        </AdminCallout>
      </div>
    )
  }

  const settings = parsePublicSettings(data ?? [])

  return (
    <div className="space-y-6">
      <PageHeader
        description="Edit the About page photo and all long-form About Me copy."
        title="About Me"
      />
      <AboutForm about={settings.about} site={settings.site} />
    </div>
  )
}
