import { NextResponse } from "next/server"
import { z } from "zod"

import { recordJobFitAnalyticsEvent } from "@/features/job-fit/lib/analytics"
import { SENIORITY_LEVELS } from "@/features/portfolio/lib/job-seniority"
import { trackServerEvent } from "@/shared/lib/analytics/posthog-server"
import { logger } from "@/shared/lib/monitoring/logger"
import { rateLimitRequest } from "@/shared/lib/security/api-route"

const bodySchema = z.object({
  contentHash: z.string().min(1).max(64),
  predictedDocumentType: z.string().min(1).max(64),
  confidence: z.number().min(0).max(1),
  wasValid: z.boolean(),
  roleTitle: z.string().max(120).nullable().optional(),
  seniority: z.enum(SENIORITY_LEVELS).optional(),
  yearsExperienceMin: z.number().min(0).max(40).nullable().optional(),
  yearsExperienceMax: z.number().min(0).max(40).nullable().optional(),
  contentPreview: z.string().max(300).optional(),
})

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, "chat")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  void trackServerEvent("anonymous", "jd_classification_feedback", {
    content_hash: body.contentHash,
    predicted_document_type: body.predictedDocumentType,
    confidence: body.confidence,
    was_valid: body.wasValid,
    role_title: body.roleTitle ?? null,
    seniority: body.seniority ?? null,
    years_experience_min: body.yearsExperienceMin ?? null,
    years_experience_max: body.yearsExperienceMax ?? null,
  })

  logger.info("[jd-feedback] classification reported as wrong", {
    contentHash: body.contentHash,
    predictedDocumentType: body.predictedDocumentType,
    confidence: body.confidence,
    wasValid: body.wasValid,
    roleTitle: body.roleTitle ?? null,
    seniority: body.seniority ?? null,
    yearsExperienceMin: body.yearsExperienceMin ?? null,
    yearsExperienceMax: body.yearsExperienceMax ?? null,
    previewLength: body.contentPreview?.length ?? 0,
  })

  void recordJobFitAnalyticsEvent({
    eventType: "classification_feedback",
    contentHash: body.contentHash,
    roleTitle: body.roleTitle ?? null,
    seniority: body.seniority ?? null,
    yearsExperienceMin: body.yearsExperienceMin ?? null,
    yearsExperienceMax: body.yearsExperienceMax ?? null,
    documentType: body.predictedDocumentType,
    confidence: body.confidence,
    wasValid: body.wasValid,
    metadata: {
      preview_length: body.contentPreview?.length ?? 0,
    },
  })

  return NextResponse.json({ ok: true }, { headers: rateLimit.headers })
}
