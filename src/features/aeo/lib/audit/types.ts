export type AeoItemType = "project" | "blog" | "research" | "automation"

export type AeoHealthBand = "optimized" | "partial" | "missing"

export type AeoRuleResult = {
  ruleId: string
  label: string
  passed: boolean
  earned: number
  max: number
  currentValue: string | null
  suggestion: string | null
}

export type AeoAuditScore = {
  id: string
  title: string
  slug: string
  type: AeoItemType
  score: number
  earnedPoints: number
  maxPoints: number
  band: AeoHealthBand
  checks: AeoRuleResult[]
  issueCount: number
  publicPath: string
  cmsPath: string
  table: "projects" | "content"
}

export type AeoAuditResult = {
  items: AeoAuditScore[]
  avgScore: number
  optimizedCount: number
  partialCount: number
  missingCount: number
  totalCount: number
  auditedAt: string
}
