import type { Project } from "@/types/database.helpers"

export type AuditDimension = "seo" | "aeo" | "geo" | "discovery" | "case_study"

export type DimensionScore = {
  dimension: AuditDimension
  label: string
  score: number
  checks: { label: string; passed: boolean }[]
  missing: string[]
}

export type AdvancedProjectAudit = {
  slug: string
  title: string
  overallScore: number
  dimensions: DimensionScore[]
  recommendations: string[]
}

type ProjectAuditInput = Pick<
  Project,
  | "slug"
  | "title"
  | "summary"
  | "seo_title"
  | "seo_description"
  | "overview"
  | "problem"
  | "why_built"
  | "approach"
  | "architecture"
  | "architecture_nodes"
  | "architecture_image"
  | "ai_design"
  | "ai_design_nodes"
  | "ai_summary"
  | "faq"
  | "key_takeaways"
  | "tradeoffs"
  | "results"
  | "learnings"
  | "gallery"
  | "demo_images"
  | "cover_image"
  | "technologies"
  | "tech_stack"
  | "expertise_slugs"
  | "concepts"
>

function scoreChecks(checks: { label: string; passed: boolean }[]): number {
  if (checks.length === 0) return 0
  const passed = checks.filter((check) => check.passed).length
  return Math.round((passed / checks.length) * 100)
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasArray(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

export function auditSeo(project: ProjectAuditInput): DimensionScore {
  const checks = [
    { label: "SEO title", passed: hasText(project.seo_title) },
    { label: "SEO description", passed: hasText(project.seo_description) },
    { label: "Summary", passed: hasText(project.summary) },
    { label: "Cover image", passed: hasText(project.cover_image) },
  ]

  return {
    dimension: "seo",
    label: "SEO",
    score: scoreChecks(checks),
    checks,
    missing: checks.filter((c) => !c.passed).map((c) => c.label),
  }
}

export function auditAeo(project: ProjectAuditInput): DimensionScore {
  const faqCount = Array.isArray(project.faq) ? project.faq.length : 0
  const checks = [
    { label: "AI summary", passed: hasText(project.ai_summary) },
    { label: "Key takeaways", passed: hasArray(project.key_takeaways) },
    { label: "FAQ coverage", passed: faqCount >= 3 },
    { label: "Question-ready summary", passed: hasText(project.summary) && faqCount > 0 },
  ]

  return {
    dimension: "aeo",
    label: "AEO",
    score: scoreChecks(checks),
    checks,
    missing: checks.filter((c) => !c.passed).map((c) => c.label),
  }
}

export function auditGeo(project: ProjectAuditInput): DimensionScore {
  const checks = [
    {
      label: "Technologies linked",
      passed: hasArray(project.tech_stack) || hasArray(project.technologies),
    },
    { label: "Expertise linked", passed: hasArray(project.expertise_slugs) },
    { label: "Concepts linked", passed: hasArray(project.concepts) },
    {
      label: "Concept density",
      passed: (project.concepts?.length ?? 0) >= 2,
    },
  ]

  return {
    dimension: "geo",
    label: "GEO",
    score: scoreChecks(checks),
    checks,
    missing: checks.filter((c) => !c.passed).map((c) => c.label),
  }
}

export function auditDiscovery(project: ProjectAuditInput): DimensionScore {
  const checks = [
    { label: "Searchable summary", passed: hasText(project.summary) },
    { label: "Tagline or impact", passed: hasText(project.overview) || hasText(project.problem) },
    { label: "Tech keywords", passed: hasArray(project.tech_stack) },
    { label: "Expertise keywords", passed: hasArray(project.expertise_slugs) },
  ]

  return {
    dimension: "discovery",
    label: "Discovery",
    score: scoreChecks(checks),
    checks,
    missing: checks.filter((c) => !c.passed).map((c) => c.label),
  }
}

export function auditCaseStudy(project: ProjectAuditInput): DimensionScore {
  const checks = [
    { label: "Problem", passed: hasText(project.problem) },
    { label: "Approach", passed: hasArray(project.approach as unknown[] | null) },
    {
      label: "Architecture",
      passed:
        hasArray(project.architecture as unknown[] | null) ||
        hasArray(project.architecture_nodes as unknown[] | null),
    },
    {
      label: "AI design",
      passed:
        hasArray(project.ai_design as unknown[] | null) ||
        hasArray(project.ai_design_nodes as unknown[] | null),
    },
    { label: "Tradeoffs", passed: Array.isArray(project.tradeoffs) && project.tradeoffs.length > 0 },
    { label: "Results", passed: hasArray(project.results) },
    { label: "Learnings", passed: hasArray(project.learnings) },
    {
      label: "Visual assets",
      passed:
        hasText(project.architecture_image) ||
        hasArray(project.gallery as unknown[] | null) ||
        hasArray(project.demo_images as unknown[] | null),
    },
  ]

  return {
    dimension: "case_study",
    label: "Case Study",
    score: scoreChecks(checks),
    checks,
    missing: checks.filter((c) => !c.passed).map((c) => c.label),
  }
}

export function auditProjectAdvanced(project: ProjectAuditInput): AdvancedProjectAudit {
  const dimensions = [
    auditSeo(project),
    auditAeo(project),
    auditGeo(project),
    auditDiscovery(project),
    auditCaseStudy(project),
  ]

  const overallScore = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length
  )

  const recommendations: string[] = []
  for (const dimension of dimensions) {
    for (const missing of dimension.missing) {
      recommendations.push(`[${dimension.label}] Add ${missing}`)
    }
  }

  return {
    slug: project.slug,
    title: project.title,
    overallScore,
    dimensions,
    recommendations: recommendations.slice(0, 8),
  }
}
