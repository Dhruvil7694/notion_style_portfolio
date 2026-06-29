import { ProjectsPreviewSection } from "@/features/home/components/projects-preview-section"
import type { ProjectListItem } from "@/features/projects/components/projects-list"

type ProjectsPreviewProps = {
  projects: ProjectListItem[]
}

export function ProjectsPreview({ projects }: ProjectsPreviewProps) {
  return <ProjectsPreviewSection projects={projects} />
}
