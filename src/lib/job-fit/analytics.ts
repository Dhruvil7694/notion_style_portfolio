import "server-only"

import { logger } from "@/lib/monitoring/logger"
import { createAdminClient } from "@/lib/supabase/admin"

export const JOB_FIT_ANALYTICS_EVENT_TYPES = [
  "jd_validated",
  "fit_analysis",
  "employer_notify",
  "pdf_export",
  "classification_feedback",
] as const

export type JobFitAnalyticsEventType =
  (typeof JOB_FIT_ANALYTICS_EVENT_TYPES)[number]

export type JobFitAnalyticsEventInput = {
  eventType: JobFitAnalyticsEventType
  contentHash?: string | null
  roleTitle?: string | null
  fitScore?: number | null
  seniority?: string | null
  yearsExperienceMin?: number | null
  yearsExperienceMax?: number | null
  documentType?: string | null
  confidence?: number | null
  wasValid?: boolean | null
  metadata?: Record<string, unknown>
}

export type JobFitAnalyticsEventRow = {
  id: string
  event_type: JobFitAnalyticsEventType
  content_hash: string | null
  role_title: string | null
  fit_score: number | null
  seniority: string | null
  years_experience_min: number | null
  years_experience_max: number | null
  document_type: string | null
  confidence: number | null
  was_valid: boolean | null
  metadata: Record<string, unknown>
  created_at: string
}

export async function recordJobFitAnalyticsEvent(
  input: JobFitAnalyticsEventInput
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("job_fit_analytics_events").insert({
      event_type: input.eventType,
      content_hash: input.contentHash ?? null,
      role_title: input.roleTitle ?? null,
      fit_score: input.fitScore ?? null,
      seniority: input.seniority ?? null,
      years_experience_min: input.yearsExperienceMin ?? null,
      years_experience_max: input.yearsExperienceMax ?? null,
      document_type: input.documentType ?? null,
      confidence: input.confidence ?? null,
      was_valid: input.wasValid ?? null,
      metadata: input.metadata ?? {},
    })

    if (error) {
      if (error.code === "23505" && input.eventType === "fit_analysis") {
        return
      }
      logger.error("[job-fit-analytics] insert failed", {
        eventType: input.eventType,
        error: error.message,
      })
    }
  } catch (error) {
    logger.error("[job-fit-analytics] insert error", {
      eventType: input.eventType,
      error: error instanceof Error ? error.message : "unknown",
    })
  }
}
