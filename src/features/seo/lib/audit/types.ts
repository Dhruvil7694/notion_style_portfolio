export type SeoItemType = "project" | "blog" | "research" | "automation"

export type SeoHealthBand = "healthy" | "warning" | "critical"

export type SeoRuleResult = {
  ruleId: string
  label: string
  passed: boolean
  earned: number
  max: number
  currentValue: string | null
  suggestion: string | null
}

export type SeoAuditScore = {
  id: string
  title: string
  slug: string
  type: SeoItemType
  score: number
  earnedPoints: number
  maxPoints: number
  band: SeoHealthBand
  checks: SeoRuleResult[]
  issueCount: number
  publicPath: string
  cmsPath: string
  table: "projects" | "content"
}

export type SeoAuditResult = {
  items: SeoAuditScore[]
  avgScore: number
  healthyCount: number
  warningCount: number
  criticalCount: number
  totalCount: number
  auditedAt: string
}
