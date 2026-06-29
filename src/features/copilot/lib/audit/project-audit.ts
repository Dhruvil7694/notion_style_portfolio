import "server-only"

import {
  parseFaqItems,
  parseProjectFacts,
  parseTradeoffItems,
} from "@/features/knowledge-base/lib/schemas"
import type { Project } from "@/shared/types/database.helpers"

import {
  buildHealthCheck,
  computeHealthScore,
  getMissingLabels,
} from "./health-score"
import type { ProjectHealthReport } from "./types"

type ProjectAuditRow = Pick<
  Project,
  | "id"
  | "slug"
  | "title"
  | "overview"
  | "problem"
  | "why_built"
  | "architecture"
  | "architecture_nodes"
  | "ai_design"
  | "ai_design_nodes"
  | "faq"
  | "key_takeaways"
  | "project_facts"
  | "tech_stack"
  | "technologies"
  | "expertise_slugs"
  | "concepts"
  | "tradeoffs"
  | "ai_summary"
>

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasArray(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function hasArchitecture(project: ProjectAuditRow): boolean {
  return (
    hasText(project.overview) ||
    hasArray(project.architecture as unknown[] | null) ||
    hasArray(project.architecture_nodes as unknown[] | null)
  )
}

function hasAiDesign(project: ProjectAuditRow): boolean {
  return (
    hasArray(project.ai_design as unknown[] | null) ||
    hasArray(project.ai_design_nodes as unknown[] | null)
  )
}

export function auditProject(project: ProjectAuditRow): ProjectHealthReport {
  const checks = [
    buildHealthCheck("overview", hasText(project.overview)),
    buildHealthCheck("problem", hasText(project.problem)),
    buildHealthCheck("why_built", hasText(project.why_built)),
    buildHealthCheck("architecture", hasArchitecture(project)),
    buildHealthCheck("ai_design", hasAiDesign(project)),
    buildHealthCheck("faq", parseFaqItems(project.faq).length > 0),
    buildHealthCheck("takeaways", hasArray(project.key_takeaways)),
    buildHealthCheck(
      "facts",
      Object.keys(parseProjectFacts(project.project_facts)).length > 0
    ),
    buildHealthCheck(
      "technologies",
      hasArray(project.tech_stack) || hasArray(project.technologies)
    ),
    buildHealthCheck("expertise", hasArray(project.expertise_slugs)),
    buildHealthCheck("concepts", hasArray(project.concepts)),
    buildHealthCheck("related_content", true),
    buildHealthCheck(
      "tradeoffs",
      parseTradeoffItems(project.tradeoffs).length > 0
    ),
    buildHealthCheck("ai_summary", hasText(project.ai_summary)),
  ]

  return {
    projectId: project.id,
    slug: project.slug,
    title: project.title,
    score: computeHealthScore(checks),
    checks,
    missing: getMissingLabels(checks),
  }
}
