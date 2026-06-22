/**
 * Feature flags extension point.
 *
 * Flags can be toggled via environment variables during development
 * and via Settings content in production (Phase 4+).
 */
export const featureFlags = {
  enableSearch: process.env.NEXT_PUBLIC_FEATURE_SEARCH !== "false",
  enableNewsletter: process.env.NEXT_PUBLIC_FEATURE_NEWSLETTER === "true",
  enableAiDemos: process.env.NEXT_PUBLIC_FEATURE_AI_DEMOS === "true",
  enablePortfolioAssistant:
    process.env.NEXT_PUBLIC_FEATURE_PORTFOLIO_ASSISTANT !== "false",
  enablePublicNotes: process.env.NEXT_PUBLIC_FEATURE_PUBLIC_NOTES === "true",
} as const

export type FeatureFlag = keyof typeof featureFlags

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag]
}
