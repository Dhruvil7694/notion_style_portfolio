import { NextResponse } from "next/server"
import { z } from "zod"

import { classifyJobDescriptionDocument } from "@/lib/ai/classify-document"
import { isAiConfigured } from "@/lib/ai/models"
import { recordJobFitAnalyticsEvent } from "@/lib/job-fit/analytics"
import { JOB_DESCRIPTION_MAX_CHARS } from "@/lib/public/job-description"
import { hashJobDescriptionContent } from "@/lib/public/job-description-validation"
import { rateLimitRequest } from "@/lib/security/api-route"

export const maxDuration = 30

const bodySchema = z.object({
  text: z.string().min(1).max(JOB_DESCRIPTION_MAX_CHARS),
})

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, "jdValidate")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  if (!(await isAiConfigured())) {
    return NextResponse.json(
      { error: "Job description validation is not available right now." },
      { status: 503, headers: rateLimit.headers }
    )
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

  try {
    const result = await classifyJobDescriptionDocument(body.text)
    const contentHash = hashJobDescriptionContent(body.text)

    void recordJobFitAnalyticsEvent({
      eventType: "jd_validated",
      contentHash,
      roleTitle: result.classification.detectedRoleTitle,
      seniority: result.classification.detectedSeniority,
      yearsExperienceMin: result.classification.yearsExperienceMin,
      yearsExperienceMax: result.classification.yearsExperienceMax,
      documentType: result.classification.documentType,
      confidence: result.classification.confidence,
      wasValid: result.valid,
    })

    if (result.valid) {
      return NextResponse.json(
        {
          valid: true,
          documentType: result.classification.documentType,
          confidence: result.classification.confidence,
          roleTitle: result.classification.detectedRoleTitle ?? null,
          seniority: result.classification.detectedSeniority,
          yearsExperienceMin: result.classification.yearsExperienceMin,
          yearsExperienceMax: result.classification.yearsExperienceMax,
        },
        { headers: rateLimit.headers }
      )
    }

    return NextResponse.json(
      {
        valid: false,
        documentType: result.classification.documentType,
        confidence: result.classification.confidence,
        message: result.error,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Couldn't validate the document.",
      },
      { status: 500, headers: rateLimit.headers }
    )
  }
}
