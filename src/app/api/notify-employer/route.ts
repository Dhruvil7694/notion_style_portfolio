import { marked } from "marked"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

import { getServerEnv } from "@/lib/env/server"
import { rateLimitRequest } from "@/lib/security/api-route"

// Configure marked for clean HTML output
marked.setOptions({ gfm: true, breaks: true })

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

function styledMd(md: string): string {
  const html = marked.parse(md) as string
  return html
    .replace(/<h2>/g, '<h2 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:#1a1a1a;border-bottom:1px solid #e5e5e5;padding-bottom:6px;">')
    .replace(/<h3>/g, '<h3 style="font-size:14px;font-weight:600;margin:16px 0 6px;color:#1a1a1a;">')
    .replace(/<p>/g, '<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#333;">')
    .replace(/<strong>/g, '<strong style="font-weight:700;color:#1a1a1a;">')
    .replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;font-size:12px;margin:12px 0;">')
    .replace(/<thead>/g, '<thead style="background:#f0f0f0;">')
    .replace(/<th>/g, '<th style="border:1px solid #ddd;padding:7px 10px;text-align:left;font-weight:600;white-space:nowrap;">')
    .replace(/<td>/g, '<td style="border:1px solid #e0e0e0;padding:6px 10px;vertical-align:top;line-height:1.5;">')
    .replace(/<tr>/g, "<tr>")
    .replace(/<ul>/g, '<ul style="margin:6px 0 10px;padding-left:20px;">')
    .replace(/<ol>/g, '<ol style="margin:6px 0 10px;padding-left:20px;">')
    .replace(/<li>/g, '<li style="margin-bottom:4px;font-size:13px;line-height:1.5;color:#333;">')
    .replace(/<code>/g, '<code style="background:#f4f4f4;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:11px;">')
    .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;">')
    .replace(/<blockquote>/g, '<blockquote style="border-left:3px solid #ddd;margin:10px 0;padding:4px 14px;color:#666;">')
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
      ${safeFitScore ? `
      <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:3px 12px;margin-bottom:4px;">
        <span style="font-size:12px;font-weight:600;color:#15803d;">Match Score: ${safeFitScore}</span>
      </div>` : ""}
    </div>

    <div style="padding:20px 28px;">

      ${safeEmployerNote ? `
      <!-- Employer note -->
      <div style="background:#fafafa;border-left:3px solid #1a1a1a;border-radius:0 6px 6px 0;padding:12px 16px;margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888;margin:0 0 6px;">Note from Employer</p>
        <p style="font-size:13px;margin:0;line-height:1.6;white-space:pre-wrap;color:#333;">${safeEmployerNote}</p>
      </div>` : ""}

      ${fitAnalysis ? `
      <!-- Fit analysis — AI-generated markdown, rendered via marked -->
      <div style="margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888;margin:0 0 12px;">Fit Analysis</p>
        <div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:8px;padding:20px 22px;">
          ${styledMd(fitAnalysis)}
        </div>
      </div>` : ""}

      ${safeJdText ? `
      <!-- JD — HTML-escaped, rendered as plain text -->
      <div>
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888;margin:0 0 12px;">Job Description</p>
        <div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:8px;padding:16px 20px;font-size:12px;line-height:1.7;color:#555;white-space:pre-wrap;">${safeJdText}</div>
      </div>` : ""}

    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #eee;padding:14px 28px;background:#fafafa;">
      <p style="font-size:11px;color:#aaa;margin:0;">Sent via your Portfolio Assistant · ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
    </div>

  </div>
</body>
</html>`

  try {
    await resend.emails.send({ from: fromAddress, to: toAddress, subject, html })
    return NextResponse.json({ ok: true }, { headers: rateLimit.headers })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500, headers: rateLimit.headers }
    )
  }
}
