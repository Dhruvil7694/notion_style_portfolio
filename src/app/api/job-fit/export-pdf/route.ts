import { NextResponse } from "next/server"
import { z } from "zod"

import { trackServerEvent } from "@/lib/analytics/posthog-server"
import { recordJobFitAnalyticsEvent } from "@/lib/job-fit/analytics"
import { renderJobFitPdfBuffer } from "@/lib/public/job-fit-pdf/render"
import { buildJobFitPdfFilename } from "@/lib/public/job-fit-pdf/report-data"
import { isJobFitAnalysisMessage } from "@/lib/public/parse-job-fit-result"
import { getPublicSettings } from "@/lib/public/queries"
import { rateLimitRequest } from "@/lib/security/api-route"

export const maxDuration = 30

const bodySchema = z.object({
  analysisMarkdown: z.string().min(1).max(12_000),
})

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, "jobFitExport")
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
      { error: "This doesn't look like a job fit analysis report." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const settings = await getPublicSettings()
  const ownerName =
    settings.site.owner_name?.trim() ||
    settings.site.site_name?.trim() ||
    "Portfolio"

  try {
    const rendered = await renderJobFitPdfBuffer(
      body.analysisMarkdown,
      ownerName
    )

    if (!rendered) {
      return NextResponse.json(
        { error: "Couldn't parse the fit analysis for export." },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const filename = buildJobFitPdfFilename(rendered.data.analysis.roleTitle)

    void trackServerEvent("anonymous", "job_fit_pdf_export", {
      role_title: rendered.data.analysis.roleTitle,
      fit_score: rendered.data.analysis.fitScore,
    })

    void recordJobFitAnalyticsEvent({
      eventType: "pdf_export",
      roleTitle: rendered.data.analysis.roleTitle,
      fitScore: rendered.data.analysis.fitScore,
      metadata: {
        filename,
      },
    })

    return new NextResponse(new Uint8Array(rendered.buffer), {
      status: 200,
      headers: {
        ...rateLimit.headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "PDF generation failed. Try again shortly." },
      { status: 500, headers: rateLimit.headers }
    )
  }
}
