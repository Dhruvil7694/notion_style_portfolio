import Link from "next/link"

import type { Project } from "@/shared/types/database.helpers"

type RelatedProject = Pick<
  Project,
  "id" | "slug" | "title" | "summary" | "tech_stack"
>

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
            <Link
              className="project-related-link"
              href={`/projects/${project.slug}`}
            >
              <span className="project-related-name">{project.title}</span>
              <span className="project-related-summary">{project.summary}</span>
              {project.tech_stack && project.tech_stack.length > 0 ? (
                <span className="project-related-meta">
                  {project.tech_stack.slice(0, 5).join(" · ")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
