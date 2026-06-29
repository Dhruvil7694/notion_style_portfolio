import { Briefcase } from "lucide-react"

import { ExperiencePreview } from "@/features/experience/components/experience-preview"
import { AiFirstSection } from "@/features/home/components/ai-first-section"
import { KnowledgeSection } from "@/features/home/components/knowledge-section"
import { ProjectsPreview } from "@/features/home/components/projects-preview"
import { ProofSection } from "@/features/home/components/proof-section"
import { SkillsPreview } from "@/features/home/components/skills-preview"
import { KbSection } from "@/features/knowledge-base/components/kb-section"
import type { MetricPreviewContext } from "@/features/portfolio/lib/metric-previews"
import type { ProjectListPreviewItem } from "@/features/portfolio/lib/project-preview-sections"
import type { PublicSettings } from "@/features/portfolio/lib/settings"
import type { StackProjectSource } from "@/features/portfolio/lib/stack-registry"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"
import { ProfileWorkspace } from "@/features/site-shell/components/profile-workspace"
import type {
  Content,
  Experience,
  Skill,
} from "@/shared/types/database.helpers"

type HomePageContentProps = {
  settings: PublicSettings
  projects: ProjectListPreviewItem[]
  metricProjects: ProjectListPreviewItem[]
  stackProjects: StackProjectSource[]
  experience: Experience[]
  allResearch: Pick<Content, "slug" | "title" | "excerpt">[]
  skills: Skill[]
  research: Pick<
    Content,
    "slug" | "title" | "excerpt" | "published_at" | "tags"
  >[]
  automations: Pick<
    Content,
    "slug" | "title" | "excerpt" | "published_at" | "tags"
  >[]
  writing: Pick<
    Content,
    "slug" | "title" | "excerpt" | "published_at" | "tags"
  >[]
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

      <SkillsPreview
        experience={experience}
        projects={stackProjects}
        skills={skills}
      />

      <ProofSection
        metrics={settings.site.selected_metrics}
        previewContext={metricPreviewContext}
      />

      <AiFirstSection />

      <KnowledgeSection
        automations={automations}
        research={research}
        writing={writing}
      />

      <ExperiencePreview items={experience} />
    </div>
  )
}
