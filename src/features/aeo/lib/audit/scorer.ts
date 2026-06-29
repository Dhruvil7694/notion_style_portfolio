import { AEO_RULES, AEO_RULES_MAX, evaluateAeoRule } from "./rules"
import { getAeoSuggestion } from "./suggestions"
import type {
  AeoAuditScore,
  AeoHealthBand,
  AeoItemType,
  AeoRuleResult,
} from "./types"

function toBand(score: number): AeoHealthBand {
  if (score >= 75) return "optimized"
  if (score >= 40) return "partial"
  return "missing"
}

function publicPath(slug: string, type: AeoItemType): string {
  switch (type) {
    case "project":
      return `/projects/${slug}`
    case "blog":
      return `/blog/${slug}`
    case "research":
      return `/research/${slug}`
    case "automation":
      return `/automations/${slug}`
  }
}

function cmsPath(id: string, table: "projects" | "content"): string {
  return table === "projects" ? `/admin/projects/${id}` : `/admin/content/${id}`
}

export function runAeoScorer(
  item: Record<string, unknown>,
  itemType: AeoItemType,
  table: "projects" | "content"
): AeoAuditScore {
  const checks: AeoRuleResult[] = []
  let earned = 0

  for (const rule of AEO_RULES) {
    const { passed, currentValue } = evaluateAeoRule(rule.id, item)
    const points = passed ? rule.points : 0
    earned += points
    checks.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      earned: points,
      max: rule.points,
      currentValue,
      suggestion: passed ? null : getAeoSuggestion(rule.id, currentValue),
    })
  }

  const score =
    AEO_RULES_MAX > 0 ? Math.round((earned / AEO_RULES_MAX) * 100) : 0
  const slug = String(item["slug"] ?? "")
  const id = String(item["id"] ?? "")

  return {
    id,
    title: String(item["title"] ?? ""),
    slug,
    type: itemType,
    score,
    earnedPoints: earned,
    maxPoints: AEO_RULES_MAX,
    band: toBand(score),
    checks,
    issueCount: checks.filter((c) => !c.passed).length,
    publicPath: publicPath(slug, itemType),
    cmsPath: cmsPath(id, table),
    table,
  }
}
