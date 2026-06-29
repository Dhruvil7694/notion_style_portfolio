import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

import { recordJobFitAnalyticsEvent } from "@/features/job-fit/lib/analytics"
import { trackServerEvent } from "@/shared/lib/analytics/posthog-server"
import { getServerEnv } from "@/shared/lib/env/server"
import { rateLimitRequest } from "@/shared/lib/security/api-route"
import { renderSanitizedEmailMarkdown } from "@/shared/lib/security/sanitize-email-html"

const bodySchema = z.object({
  jobTitle: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  jdText: z.string().max(10_000).optional(),
  fitAnalysis: z.string().max(8_000).optional(),
  fitScore: z.string().max(50).optional(),
  employerNote: z.string().max(2_000).optional(),
})

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, "notifyEmployer")
  if (!rateLimit.ok) return rateLimit.response

  const env = getServerEnv()

  if (!env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email not configured." },
      { status: 503, headers: rateLimit.headers }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", details: parsed.error.flatten().fieldErrors },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const { jobTitle, companyName, jdText, fitAnalysis, fitScore, employerNote } =
    parsed.data

  if (!jdText && !fitAnalysis) {
    return NextResponse.json(
      { error: "Missing job details." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "onboarding@resend.dev"
  const toAddress = env.ADMIN_EMAIL

  const subject = jobTitle
    ? `[Portfolio Assistant] Job Opportunity: ${jobTitle}${companyName ? ` at ${companyName}` : ""}`
    : "[Portfolio Assistant] New Job Fit Notification"

  const safeJobTitle = jobTitle ? escapeHtml(jobTitle) : "New Opportunity"
  const safeCompanyName = companyName ? escapeHtml(companyName) : null
  const safeEmployerNote = employerNote ? escapeHtml(employerNote) : null
  const safeJdText = jdText ? escapeHtml(jdText) : null
  const safeFitScore = fitScore ? escapeHtml(fitScore) : null

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#f9f9f9;">

  <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:#1a1a1a;padding:20px 28px;">
      <p style="color:#fff;font-size:15px;font-weight:700;margin:0;">Portfolio Assistant</p>
      <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:3px 0 0;">Job Fit Notification</p>
    </div>

    <!-- Title + score -->
    <div style="padding:24px 28px 0;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#1a1a1a;">
        ${safeJobTitle}${safeCompanyName ? ` <span style="color:#888;">at ${safeCompanyName}</span>` : ""}
      </h1>
      ${
        safeFitScore
          ? `
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:3px 12px;margin-bottom:4px;">
        <span style="font-size:12px;font-weight:600;color:#15803d;">Match Score: ${safeFitScore}</span>
      </div>`
          : ""
      }
    </div>

    <div style="padding:20px 28px;">

      ${
        safeEmployerNote
          ? `
      <!-- Employer note -->
      <div style="background:#fafafa;border-left:3px solid #1a1a1a;border-radius:0 6px 6px 0;padding:12px 16px;margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888;margin:0 0 6px;">Note from Employer</p>
        <p style="font-size:13px;margin:0;line-height:1.6;white-space:pre-wrap;color:#333;">${safeEmployerNote}</p>
      </div>`
          : ""
      }

      ${
        fitAnalysis
          ? `
      <!-- Fit analysis — AI-generated markdown, rendered via marked -->
      <div style="margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888;margin:0 0 12px;">Fit Analysis</p>
        <div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:8px;padding:20px 22px;">
          ${renderSanitizedEmailMarkdown(fitAnalysis)}
        </div>
      </div>`
          : ""
      }

      ${
        safeJdText
          ? `
      <!-- JD — HTML-escaped, rendered as plain text -->
      <div>
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888;margin:0 0 12px;">Job Description</p>
        <div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:8px;padding:16px 20px;font-size:12px;line-height:1.7;color:#555;white-space:pre-wrap;">${safeJdText}</div>
      </div>`
          : ""
      }

    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #eee;padding:14px 28px;background:#fafafa;">
      <p style="font-size:11px;color:#aaa;margin:0;">Sent via your Portfolio Assistant · ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
    </div>

  </div>
</body>
</html>`

  try {
    await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html,
    })
    void trackServerEvent("anonymous", "employer_notified", {
      has_job_title: Boolean(jobTitle),
      has_company: Boolean(companyName),
      has_fit_score: Boolean(fitScore),
    })
    void recordJobFitAnalyticsEvent({
      eventType: "employer_notify",
      roleTitle: jobTitle ?? null,
      fitScore: fitScore
        ? Number.parseInt(fitScore.replace(/\D/g, ""), 10) || null
        : null,
      metadata: {
        has_company: Boolean(companyName),
        has_employer_note: Boolean(employerNote),
      },
    })
    return NextResponse.json({ ok: true }, { headers: rateLimit.headers })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500, headers: rateLimit.headers }
    )
  }
}
