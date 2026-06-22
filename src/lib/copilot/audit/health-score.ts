import type { HealthCheckField, HealthCheckResult } from "./types"

const FIELD_WEIGHTS: Record<HealthCheckField, { label: string; weight: number }> = {
  overview: { label: "Overview", weight: 8 },
  problem: { label: "Problem", weight: 8 },
  why_built: { label: "Why Built", weight: 6 },
  architecture: { label: "Architecture", weight: 10 },
  ai_design: { label: "AI Design", weight: 8 },
  faq: { label: "FAQ", weight: 8 },
  takeaways: { label: "Key Takeaways", weight: 6 },
  facts: { label: "Project Facts", weight: 5 },
  technologies: { label: "Technologies", weight: 8 },
  expertise: { label: "Expertise", weight: 8 },
  concepts: { label: "Concepts", weight: 6 },
  related_content: { label: "Related Content", weight: 5 },
  tradeoffs: { label: "Tradeoffs", weight: 6 },
  ai_summary: { label: "AI Summary", weight: 8 },
}

export function computeHealthScore(checks: HealthCheckResult[]): number {
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
  const earnedWeight = checks
    .filter((check) => check.present)
    .reduce((sum, check) => sum + check.weight, 0)

  if (totalWeight === 0) return 0
  return Math.round((earnedWeight / totalWeight) * 100)
}

export function buildHealthCheck(
  field: HealthCheckField,
  present: boolean
): HealthCheckResult {
  const config = FIELD_WEIGHTS[field]
  return {
    field,
    label: config.label,
    present,
    weight: config.weight,
  }
}

export function getMissingLabels(checks: HealthCheckResult[]): string[] {
  return checks.filter((check) => !check.present).map((check) => check.label)
}

export { FIELD_WEIGHTS }
