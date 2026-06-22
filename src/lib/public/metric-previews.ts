import type { HoverPreviewCardItem } from "@/lib/public/hover-preview-types"
import { buildProjectImpactLine } from "@/lib/public/project-preview"
import type { ProjectListPreviewItem } from "@/lib/public/project-preview-sections"
import type { Content, Experience } from "@/types/database.helpers"

export type MetricPreviewContext = {
  projects: ProjectListPreviewItem[]
  experience: Pick<Experience, "id" | "role" | "company" | "description">[]
  research: Pick<Content, "slug" | "title" | "excerpt">[]
}

export type MetricPreviewResult = {
  title: string
  items: HoverPreviewCardItem[]
  viewAllHref: string
  viewAllLabel: string
}

const PREVIEW_LIMIT = 3

function toProjectPreviewItem(
  project: ProjectListPreviewItem
): HoverPreviewCardItem {
  return {
    id: project.slug,
    title: project.title,
    description: buildProjectImpactLine(project) ?? "",
    href: `/projects/${project.slug}`,
  }
}

function matchMetricKind(metric: string):
  | "production"
  | "ai_projects"
  | "research"
  | "experience"
  | null {
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
    const items = productionProjects.slice(0, PREVIEW_LIMIT).map(toProjectPreviewItem)

    return {
      title: "Production systems",
      items,
      viewAllHref: "/projects",
      viewAllLabel:
        productionProjects.length > PREVIEW_LIMIT
          ? `View all ${productionProjects.length} systems`
          : "View all projects",
    }
  }

  if (kind === "ai_projects") {
    const items = context.projects.slice(0, PREVIEW_LIMIT).map(toProjectPreviewItem)

    return {
      title: "AI projects",
      items,
      viewAllHref: "/projects",
      viewAllLabel:
        context.projects.length > PREVIEW_LIMIT
          ? `View all ${context.projects.length} projects`
          : "View all projects",
    }
  }

  if (kind === "research") {
    const items: HoverPreviewCardItem[] = context.research
      .slice(0, PREVIEW_LIMIT)
      .map((item) => ({
        id: item.slug,
        title: item.title,
        description: item.excerpt?.trim() ?? "",
        href: `/research/${item.slug}`,
        actionLabel: "Read note",
      }))

    return {
      title: "Research initiatives",
      items,
      viewAllHref: "/research",
      viewAllLabel:
        context.research.length > PREVIEW_LIMIT
          ? `View all ${context.research.length} notes`
          : "View all research",
    }
  }

  const items: HoverPreviewCardItem[] = context.experience
    .slice(0, PREVIEW_LIMIT)
    .map((entry) => ({
      id: entry.id,
      title: `${entry.role} · ${entry.company}`,
      description: entry.description?.trim() ?? "Production engineering across data, API, and workflow layers.",
      href: `/experience/${entry.id}`,
      actionLabel: "View role",
    }))

  return {
    title: "Experience",
    items,
    viewAllHref: "/experience",
    viewAllLabel:
      context.experience.length > PREVIEW_LIMIT
        ? `View all ${context.experience.length} roles`
        : "View full experience",
  }
}

export function metricHasPreview(metric: string): boolean {
  return matchMetricKind(metric) !== null
}
