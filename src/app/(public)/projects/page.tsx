import { PageShell } from "@/components/public/content-shell"
import { ProjectsListWithFiltersLazy } from "@/components/public/projects-list-with-filters-lazy"
import { getPublicSettings, getPublishedProjects } from "@/lib/public/queries"
import { buildProjectsIndexMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildProjectsIndexMetadata({ settings })
}

export default async function ProjectsPage() {
  const { data: projects } = await getPublishedProjects()

  return (
    <PageShell
      description="Production systems, experiments, and engineering work."
      title="Projects"
    >
      {projects.length > 0 ? (
        <ProjectsListWithFiltersLazy projects={projects} />
      ) : (
        <p className="kb-empty-message">Projects will appear here as they are published.</p>
      )}
    </PageShell>
  )
}
