export type VisibilityMode = "seo" | "aeo" | "geo"

export type SeoFix = {
  seo_title: string
  seo_description: string
  ai_summary: string
  key_takeaways: string[]
  faq: Array<{ question: string; answer: string }>
  summary: string
  tags: string[]
  reasoning: string
}

export type AeoFix = {
  ai_summary: string
  key_takeaways: string[]
  faq: Array<{ question: string; answer: string }>
  concepts: string[]
  summary: string
  expertise_slugs: string[]
  reasoning: string
}

export type GeoFix = {
  ai_summary: string
  key_takeaways: string[]
  concepts: string[]
  faq: Array<{ question: string; answer: string }>
  summary: string
  tags: string[]
  expertise_slugs: string[]
  reasoning: string
}

export type VisibilityFix =
  | { mode: "seo"; fix: SeoFix }
  | { mode: "aeo"; fix: AeoFix }
  | { mode: "geo"; fix: GeoFix }

export type VisibilityFixResult =
  | { ok: true; fix: VisibilityFix }
  | { ok: false; error: string }

export type FixDiffField = {
  key: string
  label: string
  before: unknown
  after: unknown
}
