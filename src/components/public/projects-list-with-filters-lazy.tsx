"use client"

import dynamic from "next/dynamic"

import { PageLoadingShell } from "@/components/public/page-loading-shell"
import type { ProjectListItem } from "@/components/public/projects-list"

const ProjectsListWithFiltersImpl = dynamic(
  () =>
    import("@/components/public/projects-list-with-filters").then((module) => ({
      default: module.ProjectsListWithFilters,
    })),
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
