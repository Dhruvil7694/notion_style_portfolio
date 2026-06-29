export type GeoItemType = "project" | "blog" | "research" | "automation"

export type GeoHealthBand = "prominent" | "emerging" | "absent"

export type GeoRuleResult = {
  ruleId: string
  label: string
  passed: boolean
  earned: number
  max: number
  currentValue: string | null
  suggestion: string | null
}

export type GeoAuditScore = {
  id: string
  title: string
  slug: string
  type: GeoItemType
  score: number
  earnedPoints: number
  maxPoints: number
  band: GeoHealthBand
  checks: GeoRuleResult[]
  issueCount: number
  publicPath: string
  cmsPath: string
  table: "projects" | "content"
}

export type GeoAuditResult = {
  items: GeoAuditScore[]
  avgScore: number
  prominentCount: number
  emergingCount: number
  absentCount: number
  totalCount: number
  auditedAt: string
}
