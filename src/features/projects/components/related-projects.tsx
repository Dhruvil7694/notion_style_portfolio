import type { Project } from "@/shared/types/database.helpers"
import { RelatedProjectCard } from "@/shared/ui/card-08"

type RelatedProject = Pick<Project, "id" | "slug" | "title" | "summary">

type RelatedProjectsProps = {
  projects: RelatedProject[]
}

export function RelatedProjects({ projects }: RelatedProjectsProps) {
  if (projects.length === 0) {
    return null
  }

  return (
    <section className="project-related">
      <h2 className="project-related-title">Related Projects</h2>
      <ul className="project-related-list">
        {projects.map((project) => (
          <li className="project-related-item" key={project.id}>
            <RelatedProjectCard
              body={project.summary ?? "View this project case study."}
              href={`/projects/${project.slug}`}
              title={project.title}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
