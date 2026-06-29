"use client"

import dynamic from "next/dynamic"

import type { ProjectListItem } from "@/features/projects/components/projects-list"
import { PageLoadingShell } from "@/features/site-shell/components/page-loading-shell"

const ProjectsListWithFiltersImpl = dynamic(
  () =>
    import("@/features/projects/components/projects-list-with-filters").then(
      (module) => ({
        default: module.ProjectsListWithFilters,
      })
    ),
  {
    ssr: false,
    loading: () => <PageLoadingShell rows={8} />,
  }
)

type ProjectsListWithFiltersLazyProps = {
  projects: ProjectListItem[]
}

export function ProjectsListWithFiltersLazy({
  projects,
}: ProjectsListWithFiltersLazyProps) {
  return <ProjectsListWithFiltersImpl projects={projects} />
}
