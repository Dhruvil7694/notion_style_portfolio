import { ExperienceList } from "@/features/experience/components/experience-list"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import {
  getExperienceList,
  getPublicSettings,
} from "@/features/portfolio/lib/queries"
import { buildExperienceIndexMetadata } from "@/features/seo/lib"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"

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
