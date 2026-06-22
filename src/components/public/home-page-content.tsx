import { Briefcase } from "lucide-react"

import { AiFirstSection } from "@/components/public/ai-first-section"
import { PublicEmptyState } from "@/components/public/empty-state"
import { ExperiencePreview } from "@/components/public/experience-preview"
import { KbSection } from "@/components/public/kb-section"
import { KnowledgeSection } from "@/components/public/knowledge-section"
import { ProfileWorkspace } from "@/components/public/profile-workspace"
import { ProjectsPreview } from "@/components/public/projects-preview"
import { ProofSection } from "@/components/public/proof-section"
import { SkillsPreview } from "@/components/public/skills-preview"
import type { MetricPreviewContext } from "@/lib/public/metric-previews"
import type { ProjectListPreviewItem } from "@/lib/public/project-preview-sections"
import type { PublicSettings } from "@/lib/public/settings"
import type { StackProjectSource } from "@/lib/public/stack-registry"
import type { Content, Experience, Skill } from "@/types/database.helpers"

type HomePageContentProps = {
  settings: PublicSettings
  projects: ProjectListPreviewItem[]
  metricProjects: ProjectListPreviewItem[]
  stackProjects: StackProjectSource[]
  experience: Experience[]
  allResearch: Pick<Content, "slug" | "title" | "excerpt">[]
  skills: Skill[]
  research: Pick<Content, "slug" | "title" | "excerpt" | "published_at" | "tags">[]
  automations: Pick<Content, "slug" | "title" | "excerpt" | "published_at" | "tags">[]
  writing: Pick<Content, "slug" | "title" | "excerpt" | "published_at" | "tags">[]
  resumeAvailable: boolean
}

export function HomePageContent({
  settings,
  projects,
  metricProjects,
  stackProjects,
  experience,
  allResearch,
  skills,
  research,
  automations,
  writing,
  resumeAvailable,
}: HomePageContentProps) {
  const metricPreviewContext: MetricPreviewContext = {
    projects: metricProjects,
    experience: experience.map((entry) => ({
      id: entry.id,
      role: entry.role,
      company: entry.company,
      description: entry.description,
    })),
    research: allResearch,
  }

  return (
    <div className="kb-page kb-page-home pb-kb-section">
      <ProfileWorkspace resumeAvailable={resumeAvailable} settings={settings} />

      {projects.length > 0 ? (
        <ProjectsPreview projects={projects} />
      ) : (
        <KbSection
          description="Production systems, research platforms, and applied experiments."
          icon={Briefcase}
          id="projects"
          title="Selected Work"
        >
          <PublicEmptyState message="Featured projects will appear here once published." />
        </KbSection>
      )}

      <SkillsPreview experience={experience} projects={stackProjects} skills={skills} />

      <ProofSection metrics={settings.site.selected_metrics} previewContext={metricPreviewContext} />

      <AiFirstSection />

      <KnowledgeSection automations={automations} research={research} writing={writing} />

      <ExperiencePreview items={experience} />
    </div>
  )
}
