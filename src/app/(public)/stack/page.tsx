import { PageShell } from "@/components/public/content-shell"
import { StackTableLazy } from "@/components/public/stack-table-lazy"
import {
  getExperienceList,
  getPublicSettings,
  getPublishedProjects,
  getSkillsList,
} from "@/lib/public/queries"
import { buildSkillDetailRows } from "@/lib/public/stack-registry"
import { createPageMetadata } from "@/lib/utils/metadata"

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
