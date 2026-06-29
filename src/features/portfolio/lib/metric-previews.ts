import type { ProjectListPreviewItem } from "@/features/portfolio/lib/project-preview-sections"
import type { Content, Experience } from "@/shared/types/database.helpers"

export type MetricPreviewContext = {
  projects: ProjectListPreviewItem[]
  experience: Pick<Experience, "id" | "role" | "company" | "description">[]
  research: Pick<Content, "slug" | "title" | "excerpt">[]
}

export type MetricPreviewLink = {
  id: string
  title: string
  href: string
}

export type MetricPreviewResult = {
  title: string
  items: MetricPreviewLink[]
}

function matchMetricKind(
  metric: string
): "production" | "ai_projects" | "research" | "experience" | null {
  const normalized = metric.toLowerCase()

  if (normalized.includes("production")) {
    return "production"
  }

  if (normalized.includes("research")) {
    return "research"
  }

  if (normalized.includes("project") || normalized.includes("ai")) {
    return "ai_projects"
  }

  if (
    normalized.includes("year") ||
    normalized.includes("experience") ||
    normalized.includes("software")
  ) {
    return "experience"
  }

  return null
}

export function resolveMetricPreview(
  metric: string,
  context: MetricPreviewContext
): MetricPreviewResult | null {
  const kind = matchMetricKind(metric)
  if (!kind) {
    return null
  }

  if (kind === "production") {
    const productionProjects = context.projects.filter(
      (project) =>
        project.featured ||
        project.category?.toLowerCase().includes("production") ||
        Boolean(project.impact?.trim())
    )

    return {
      title: "Production systems",
      items: productionProjects.map((project) => ({
        id: project.slug,
        title: project.title,
        href: `/projects/${project.slug}`,
      })),
    }
  }

  if (kind === "ai_projects") {
    return {
      title: "AI projects",
      items: context.projects.map((project) => ({
        id: project.slug,
        title: project.title,
        href: `/projects/${project.slug}`,
      })),
    }
  }

  if (kind === "research") {
    return {
      title: "Research initiatives",
      items: context.research.map((item) => ({
        id: item.slug,
        title: item.title,
        href: `/research/${item.slug}`,
      })),
    }
  }

  return {
    title: "Experience",
    items: context.experience.map((entry) => ({
      id: entry.id,
      title: `${entry.role} · ${entry.company}`,
      href: `/experience/${entry.id}`,
    })),
  }
}

export function metricHasPreview(metric: string): boolean {
  return matchMetricKind(metric) !== null
}
