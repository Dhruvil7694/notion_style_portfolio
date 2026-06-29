import {
  scoreContent,
  scoreProject,
} from "@/features/admin/lib/content-health/scoring"

import { evaluateSeoRule, SEO_RULES, SEO_RULES_MAX } from "./rules"
import { getSuggestion } from "./suggestions"
import type {
  SeoAuditScore,
  SeoHealthBand,
  SeoItemType,
  SeoRuleResult,
} from "./types"

function toBand(score: number): SeoHealthBand {
  if (score >= 80) return "healthy"
  if (score >= 50) return "warning"
  return "critical"
}

function publicPath(slug: string, type: SeoItemType): string {
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

export function runSeoScorer(
  item: Record<string, unknown>,
  itemType: SeoItemType,
  table: "projects" | "content"
): SeoAuditScore {
  const setA = itemType === "project" ? scoreProject(item) : scoreContent(item)

  const checks: SeoRuleResult[] = []
  let setBEarned = 0

  for (const rule of SEO_RULES) {
    const { passed, currentValue } = evaluateSeoRule(rule.id, item, itemType)
    const earned = passed ? rule.points : 0
    setBEarned += earned
    checks.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      earned,
      max: rule.points,
      currentValue,
      suggestion: passed ? null : getSuggestion(rule.id, currentValue),
    })
  }

  const totalEarned = setA.earnedPoints + setBEarned
  const totalMax = setA.maxPoints + SEO_RULES_MAX
  const score = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0

  const slug = String(item["slug"] ?? "")

  const id = String(item["id"] ?? "")

  return {
    id,
    title: String(item["title"] ?? ""),
    slug,
    type: itemType,
    score,
    earnedPoints: totalEarned,
    maxPoints: totalMax,
    band: toBand(score),
    checks,
    issueCount: checks.filter((c) => !c.passed).length,
    publicPath: publicPath(slug, itemType),
    cmsPath: cmsPath(id, table),
    table,
  }
}
