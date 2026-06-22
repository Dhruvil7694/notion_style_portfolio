"use client"

import { Briefcase } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"

import { PublicEmptyState } from "@/components/public/empty-state"
import { KbSection } from "@/components/public/kb-section"
import { type ProjectListItem, ProjectsList } from "@/components/public/projects-list"

type ProjectsPreviewSectionProps = {
  projects: ProjectListItem[]
}

export function ProjectsPreviewSection({ projects }: ProjectsPreviewSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <KbSection
      className="projects-section"
      description="Production systems, research platforms, and applied experiments."
      icon={Briefcase}
      id="projects"
      title="Selected Work"
    >
      <div ref={sectionRef as never}>
        {projects.length > 0 ? (
          <>
            <ProjectsList previewAnchorRef={sectionRef} projects={projects} />
            <Link className="kb-section-link projects-section-more" href="/projects">
              View all projects
            </Link>
          </>
        ) : (
          <PublicEmptyState message="Featured projects will appear here once published." />
        )}
      </div>
    </KbSection>
  )
}
