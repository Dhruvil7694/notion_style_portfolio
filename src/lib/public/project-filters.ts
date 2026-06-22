import type { ProjectListPreviewItem } from "@/lib/public/project-preview-sections"

export type ProjectListItem = ProjectListPreviewItem

export type ProjectFilterState = {
  query: string
  category: string | null
  tech: string[]
  featuredOnly: boolean
}

export const EMPTY_PROJECT_FILTERS: ProjectFilterState = {
  query: "",
  category: null,
  tech: [],
  featuredOnly: false,
}

export type ProjectFilterOptions = {
  categories: string[]
  techStack: string[]
}

export function buildProjectFilterOptions(projects: ProjectListItem[]): ProjectFilterOptions {
  const categories = new Set<string>()
  const techStack = new Set<string>()

  for (const project of projects) {
    if (project.category?.trim()) {
      categories.add(project.category.trim())
    }

    for (const item of project.tech_stack ?? []) {
      if (item.trim()) {
        techStack.add(item.trim())
      }
    }
  }

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    techStack: [...techStack].sort((a, b) => a.localeCompare(b)),
  }
}

export function filterProjects(
  projects: ProjectListItem[],
  filters: ProjectFilterState
): ProjectListItem[] {
  const query = filters.query.trim().toLowerCase()

  return projects.filter((project) => {
    if (filters.featuredOnly && !project.featured) {
      return false
    }

    if (filters.category && project.category !== filters.category) {
      return false
    }

    if (filters.tech.length > 0) {
      const stack = new Set((project.tech_stack ?? []).map((item) => item.toLowerCase()))
      const hasSelectedTech = filters.tech.some((item) => stack.has(item.toLowerCase()))

      if (!hasSelectedTech) {
        return false
      }
    }

    if (!query) {
      return true
    }

    const searchable = [
      project.title,
      project.summary,
      project.tagline,
      project.category,
      project.role,
      ...(project.tech_stack ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return searchable.includes(query)
  })
}

export function hasActiveProjectFilters(filters: ProjectFilterState): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.category !== null ||
    filters.tech.length > 0 ||
    filters.featuredOnly
  )
}

export function countActiveProjectFilters(filters: ProjectFilterState): number {
  let count = 0

  if (filters.query.trim()) {
    count += 1
  }

  if (filters.category) {
    count += 1
  }

  if (filters.tech.length > 0) {
    count += 1
  }

  if (filters.featuredOnly) {
    count += 1
  }

  return count
}
