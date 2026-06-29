import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { StackTableLazy } from "@/features/knowledge-base/components/stack-table-lazy"
import {
  getExperienceList,
  getPublicSettings,
  getPublishedProjects,
  getSkillsList,
} from "@/features/portfolio/lib/queries"
import { buildSkillDetailRows } from "@/features/portfolio/lib/stack-registry"
import { createPageMetadata } from "@/shared/lib/utils/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return createPageMetadata({
    title: "Stack",
    description: `Full technology stack for ${settings.site.owner_name || settings.site.site_name}, with project and experience usage.`,
    path: "/stack",
    siteName: settings.site.site_name,
    siteUrl: settings.site.site_url,
  })
}

export default async function StackPage() {
  const [{ data: skills }, { data: projects }, { data: experience }] =
    await Promise.all([
      getSkillsList(),
      getPublishedProjects(),
      getExperienceList(),
    ])

  const rows = buildSkillDetailRows(skills, projects, experience)

  return (
    <PageShell
      className="max-w-stack"
      description="Technologies, proficiency, and where each skill shows up across projects and roles."
      title="Stack"
    >
      <StackTableLazy rows={rows} />
    </PageShell>
  )
}
