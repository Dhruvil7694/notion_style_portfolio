import { evaluateGeoRule, GEO_RULES, GEO_RULES_MAX } from "./rules"
import { getGeoSuggestion } from "./suggestions"
import type {
  GeoAuditScore,
  GeoHealthBand,
  GeoItemType,
  GeoRuleResult,
} from "./types"

function toBand(score: number): GeoHealthBand {
  if (score >= 70) return "prominent"
  if (score >= 35) return "emerging"
  return "absent"
}

function publicPath(slug: string, type: GeoItemType): string {
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

export function runGeoScorer(
  item: Record<string, unknown>,
  itemType: GeoItemType,
  table: "projects" | "content"
): GeoAuditScore {
  const checks: GeoRuleResult[] = []
  let earned = 0

  for (const rule of GEO_RULES) {
    const { passed, currentValue } = evaluateGeoRule(rule.id, item)
    const points = passed ? rule.points : 0
    earned += points
    checks.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      earned: points,
      max: rule.points,
      currentValue,
      suggestion: passed ? null : getGeoSuggestion(rule.id, currentValue),
    })
  }

  const score =
    GEO_RULES_MAX > 0 ? Math.round((earned / GEO_RULES_MAX) * 100) : 0
  const slug = String(item["slug"] ?? "")
  const id = String(item["id"] ?? "")

  return {
    id,
    title: String(item["title"] ?? ""),
    slug,
    type: itemType,
    score,
    earnedPoints: earned,
    maxPoints: GEO_RULES_MAX,
    band: toBand(score),
    checks,
    issueCount: checks.filter((c) => !c.passed).length,
    publicPath: publicPath(slug, itemType),
    cmsPath: cmsPath(id, table),
    table,
  }
}
