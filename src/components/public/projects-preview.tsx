import type { ProjectListItem } from "@/components/public/projects-list"
import { ProjectsPreviewSection } from "@/components/public/projects-preview-section"

type ProjectsPreviewProps = {
  projects: ProjectListItem[]
}

export function ProjectsPreview({ projects }: ProjectsPreviewProps) {
  return <ProjectsPreviewSection projects={projects} />
}
