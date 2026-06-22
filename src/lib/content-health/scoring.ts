import { HEALTH_RULES } from "./rules"

export type HealthCheckResult = {
  ruleId: string
  label: string
  passed: boolean
  points: number
  earned: number
}

export type ContentHealthScore = {
  id: string
  title: string
  slug: string
  type: "project" | "research" | "writing" | "automation"
  score: number
  maxScore: number
  earnedPoints: number
  maxPoints: number
  checks: HealthCheckResult[]
  missing: string[]
  potentialScore: number
}

function hasArray(val: unknown): boolean {
  return Array.isArray(val) && val.length > 0
}

function hasTruthy(val: unknown): boolean {
  return Boolean(val)
}

function evaluateProjectRule(
  id: string,
  project: Record<string, unknown>
): boolean {
  switch (id) {
    case "title":
      return hasTruthy(project["title"])
    case "slug":
      return hasTruthy(project["slug"])
    case "summary":
      return hasTruthy(project["summary"])
    case "overview":
      return hasTruthy(project["overview"])
    case "problem_statement":
      return hasTruthy(project["problem_statement"])
    case "tech_stack":
      return hasArray(project["tech_stack"])
    case "cover_image":
      return hasTruthy(project["cover_image_url"])
    case "screenshots":
      return hasArray(project["screenshots"])
    case "ai_summary":
      return hasTruthy(project["ai_summary"])
    case "faq":
      return hasArray(project["faq"])
    case "og_title":
      return hasTruthy(project["og_title"])
    case "og_description":
      return hasTruthy(project["og_description"])
    case "results_metrics":
      return hasTruthy(project["results_metrics"])
    case "learnings":
      return hasTruthy(project["learnings"])
    case "expertise_slugs":
      return hasArray(project["expertise_slugs"])
    default:
      return false
  }
}

function evaluateContentRule(
  id: string,
  item: Record<string, unknown>
): boolean {
  switch (id) {
    case "title":
      return hasTruthy(item["title"])
    case "slug":
      return hasTruthy(item["slug"])
    case "summary":
      return hasTruthy(item["summary"])
    case "cover_image":
      return hasTruthy(item["cover_image_url"])
    case "ai_summary":
      return hasTruthy(item["ai_summary"])
    case "faq":
      return hasArray(item["faq"])
    case "og_title":
      return hasTruthy(item["og_title"])
    case "og_description":
      return hasTruthy(item["og_description"])
    default:
      return false
  }
}

export function scoreProject(
  project: Record<string, unknown>
): ContentHealthScore {
  const rules = HEALTH_RULES.projects
  const checks: HealthCheckResult[] = []
  let earnedPoints = 0
  let maxPoints = 0

  for (const rule of rules) {
    const passed = evaluateProjectRule(rule.id, project)
    const earned = passed ? rule.points : 0
    checks.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      points: rule.points,
      earned,
    })
    maxPoints += rule.points
    earnedPoints += earned
  }

  const missing = checks
    .filter((c) => !c.passed)
    .map((c) => c.label)

  const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0
  const potentialScore = 100

  return {
    id: String(project["id"] ?? ""),
    title: String(project["title"] ?? ""),
    slug: String(project["slug"] ?? ""),
    type: "project",
    score,
    maxScore: 100,
    earnedPoints,
    maxPoints,
    checks,
    missing,
    potentialScore,
  }
}

export function scoreContent(
  item: Record<string, unknown>
): ContentHealthScore {
  const rules = HEALTH_RULES.content
  const checks: HealthCheckResult[] = []
  let earnedPoints = 0
  let maxPoints = 0

  for (const rule of rules) {
    const passed = evaluateContentRule(rule.id, item)
    const earned = passed ? rule.points : 0
    checks.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      points: rule.points,
      earned,
    })
    maxPoints += rule.points
    earnedPoints += earned
  }

  const missing = checks
    .filter((c) => !c.passed)
    .map((c) => c.label)

  const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0

  const rawType = String(item["type"] ?? "writing")
  const type =
    rawType === "research" || rawType === "automation"
      ? (rawType as "research" | "automation")
      : "writing"

  return {
    id: String(item["id"] ?? ""),
    title: String(item["title"] ?? ""),
    slug: String(item["slug"] ?? ""),
    type,
    score,
    maxScore: 100,
    earnedPoints,
    maxPoints,
    checks,
    missing,
    potentialScore: 100,
  }
}
