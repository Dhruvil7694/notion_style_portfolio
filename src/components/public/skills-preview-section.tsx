import { Layers } from "lucide-react"
import Link from "next/link"

import { KbSection } from "@/components/public/kb-section"
import { SkillsShowcase } from "@/components/public/skills-showcase"
import type { Experience, Project, Skill } from "@/types/database.helpers"

type SkillsPreviewSectionProps = {
  skills: Skill[]
  projects: Pick<Project, "id" | "slug" | "title" | "tech_stack">[]
  experience: Pick<Experience, "id" | "role" | "company" | "tech_stack">[]
}

export function SkillsPreviewSection({
  skills,
  projects,
  experience,
}: SkillsPreviewSectionProps) {
  return (
    <KbSection
      className="skills-section"
      description="The platforms, languages, and infrastructure behind the work."
      icon={Layers}
      id="tech-stack"
      title="Tech Stack"
    >
      <SkillsShowcase experience={experience} projects={projects} skills={skills} />
      <Link className="kb-section-link skills-section-more" href="/stack">
        View all
      </Link>
    </KbSection>
  )
}
