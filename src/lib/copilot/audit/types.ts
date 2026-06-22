export type HealthCheckField =
  | "overview"
  | "problem"
  | "why_built"
  | "architecture"
  | "ai_design"
  | "faq"
  | "takeaways"
  | "facts"
  | "technologies"
  | "expertise"
  | "concepts"
  | "related_content"
  | "tradeoffs"
  | "ai_summary"

export type HealthCheckResult = {
  field: HealthCheckField
  label: string
  present: boolean
  weight: number
}

export type ProjectHealthReport = {
  projectId: string
  slug: string
  title: string
  score: number
  checks: HealthCheckResult[]
  missing: string[]
}

export type PortfolioHealthReport = {
  score: number
  projectCount: number
  projects: ProjectHealthReport[]
  portfolioIssues: PortfolioIssue[]
}

export type PortfolioIssue = {
  type:
    | "missing_faq"
    | "missing_architecture"
    | "missing_ai_summary"
    | "missing_tradeoffs"
    | "unlinked_technology"
    | "unlinked_expertise"
    | "weak_connection"
    | "duplicate_concept"
    | "duplicate_technology"
  message: string
  entitySlug?: string
  entityTitle?: string
}

export type RelationshipSuggestion = {
  type: "add_technology" | "add_expertise" | "add_concept" | "link_project"
  entityType: "project" | "content" | "skill" | "technology" | "concept"
  entitySlug: string
  entityTitle: string
  suggestedSlug: string
  suggestedTitle: string
  reason: string
  confidence: "high" | "medium" | "low"
}
