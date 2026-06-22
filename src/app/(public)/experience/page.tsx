import { PageShell } from "@/components/public/content-shell"
import { PublicEmptyState } from "@/components/public/empty-state"
import { ExperienceList } from "@/components/public/experience-list"
import { getExperienceList, getPublicSettings } from "@/lib/public/queries"
import { buildExperienceIndexMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildExperienceIndexMetadata({ settings })
}

export default async function ExperiencePage() {
  const { data: experience } = await getExperienceList()

  return (
    <PageShell
      description="Roles, companies, and engineering work over time."
      title="Experience"
    >
      {experience.length > 0 ? (
        <ExperienceList items={experience} />
      ) : (
        <PublicEmptyState message="Experience entries will appear here once added." />
      )}
    </PageShell>
  )
}
