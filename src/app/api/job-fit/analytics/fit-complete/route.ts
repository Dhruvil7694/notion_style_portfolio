import { NextResponse } from "next/server"
import { z } from "zod"

import { recordJobFitAnalyticsEvent } from "@/lib/job-fit/analytics"
import {
  isJobFitAnalysisMessage,
  parseJobFitAnalysis,
} from "@/lib/public/parse-job-fit-result"
import { rateLimitRequest } from "@/lib/security/api-route"

const bodySchema = z.object({
  analysisMarkdown: z.string().min(1).max(12_000),
  contentHash: z.string().max(64).optional(),
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

  if (!isJobFitAnalysisMessage(body.analysisMarkdown)) {
    return NextResponse.json(
      { error: "Invalid fit analysis payload." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const parsed = parseJobFitAnalysis(body.analysisMarkdown)
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse fit analysis." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  await recordJobFitAnalyticsEvent({
    eventType: "fit_analysis",
    contentHash: body.contentHash ?? null,
    roleTitle: parsed.roleTitle,
    fitScore: parsed.fitScore,
    metadata: {
      fit_score_label: parsed.fitScoreLabel,
    },
  })

  return NextResponse.json({ ok: true }, { headers: rateLimit.headers })
}
