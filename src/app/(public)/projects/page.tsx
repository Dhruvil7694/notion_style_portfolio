import { PageShell } from "@/features/knowledge-base/components/content-shell"
import {
  getPublicSettings,
  getPublishedProjects,
} from "@/features/portfolio/lib/queries"
import { ProjectsListWithFiltersLazy } from "@/features/projects/components/projects-list-with-filters-lazy"
import { buildProjectsIndexMetadata } from "@/features/seo/lib"

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
        <p className="kb-empty-message">
          Projects will appear here as they are published.
        </p>
      )}
    </PageShell>
  )
}
