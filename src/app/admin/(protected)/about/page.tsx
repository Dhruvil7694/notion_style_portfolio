import { PageHeader } from "@/components/admin"
import { AboutForm } from "@/features/admin/forms/about-form"
import { getAdminSettings } from "@/lib/admin/queries"
import { parsePublicSettings } from "@/lib/public/settings"

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
        <p className="text-destructive text-sm" role="alert">
          Unable to load About Me content: {error.message}
        </p>
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
