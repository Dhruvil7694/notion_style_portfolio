"use client"

import { useMemo, useState } from "react"

import { type ProjectListItem,ProjectsList } from "@/components/public/projects-list"
import { ProjectsListFilters } from "@/components/public/projects-list-filters"
import {
  buildProjectFilterOptions,
  EMPTY_PROJECT_FILTERS,
  filterProjects,
  type ProjectFilterState,
} from "@/lib/public/project-filters"

type ProjectsListWithFiltersProps = {
  projects: ProjectListItem[]
}

export function ProjectsListWithFilters({ projects }: ProjectsListWithFiltersProps) {
  const [filters, setFilters] = useState<ProjectFilterState>(EMPTY_PROJECT_FILTERS)

  const options = useMemo(() => buildProjectFilterOptions(projects), [projects])
  const filteredProjects = useMemo(
    () => filterProjects(projects, filters),
    [filters, projects]
  )

  return (
    <div className="projects-list-with-filters">
      <ProjectsListFilters
        filters={filters}
        onChange={setFilters}
        options={options}
        resultCount={filteredProjects.length}
        totalCount={projects.length}
      />

      {filteredProjects.length > 0 ? (
        <ProjectsList projects={filteredProjects} />
      ) : (
        <p className="kb-empty-message">No projects match your search or filters.</p>
      )}
    </div>
  )
}
