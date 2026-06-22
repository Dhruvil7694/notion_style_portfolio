import { SkillsPreviewSection } from "@/components/public/skills-preview-section"
import type { Experience, Project, Skill } from "@/types/database.helpers"

type SkillsPreviewProps = {
  skills: Skill[]
  projects: Pick<Project, "id" | "slug" | "title" | "tech_stack">[]
  experience: Pick<Experience, "id" | "role" | "company" | "tech_stack">[]
}

export function SkillsPreview({ skills, projects, experience }: SkillsPreviewProps) {
  return (
    <SkillsPreviewSection experience={experience} projects={projects} skills={skills} />
  )
}
