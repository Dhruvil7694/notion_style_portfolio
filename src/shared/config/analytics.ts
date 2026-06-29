/**
 * Analytics extension point (Phase 5+).
 *
 * Intended integrations:
 * - Vercel Analytics
 * - Plausible
 * - Custom event tracking (resume_download, contact_submit)
 *
 * Implementation notes:
 * - Load analytics scripts only in production
 * - Respect privacy settings from Settings content type
 * - Keep provider-specific logic isolated in this module
 */
export const analyticsConfig = {
  enabled: false,
  provider: null as "vercel" | "plausible" | null,
  publicSiteId: process.env.NEXT_PUBLIC_ANALYTICS_ID ?? null,
} as const

export type AnalyticsEvent =
  | "page_view"
  | "resume_download"
  | "contact_submit"
  | "project_view"
  | "blog_view"

/** Placeholder — implement trackEvent in Phase 5. */
export function trackEvent(): void {
  // No-op until analytics provider is configured.
}
