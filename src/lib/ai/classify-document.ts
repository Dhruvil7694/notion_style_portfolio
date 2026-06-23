import "server-only"

import { generateObject } from "ai"
import { z } from "zod"

import { logger } from "@/lib/monitoring/logger"
import { SENIORITY_LEVELS } from "@/lib/public/job-seniority"

import { getAiSettings } from "./get-ai-settings"
import { resolveModelChain } from "./providers/router"
import { aiTelemetry } from "./sentry-telemetry"
import { trackAiUsage } from "./usage/track-usage"

const CLASSIFIER_SAMPLE_CHARS = 4_000

const documentClassificationSchema = z.object({
  documentType: z.enum([
    "job_description",
    "resume",
    "cover_letter",
    "other",
    "unclear",
  ]),
  confidence: z.number().min(0).max(1),
  userMessage: z
    .string()
    .max(220)
    .describe(
      "One short sentence for the user. If valid JD, neutral confirmation. If invalid, explain what to upload instead."
    ),
  detectedRoleTitle: z
    .string()
    .max(120)
    .nullable()
    .describe("Job title if clearly stated in the posting, otherwise null"),
  detectedSeniority: z
    .enum(SENIORITY_LEVELS)
    .describe(
      "Seniority level implied by title, years required, or responsibilities. Use unknown if not discernible."
    ),
  yearsExperienceMin: z
    .number()
    .min(0)
    .max(40)
    .nullable()
    .describe("Minimum years of experience if stated, else null"),
  yearsExperienceMax: z
    .number()
    .min(0)
    .max(40)
    .nullable()
    .describe(
      "Maximum years if a range is stated (e.g. 3-5 → min 3 max 5). Same as min for exact values. Null if not stated."
    ),
})

export type DocumentClassification = z.infer<
  typeof documentClassificationSchema
>

export type DocumentClassificationResult =
  | {
      valid: true
      classification: DocumentClassification
    }
  | {
      valid: false
      classification: DocumentClassification
      error: string
    }

const CLASSIFIER_SYSTEM = `You classify text extracted from an uploaded file for a portfolio "job fit" checker.

The user must provide an employer's JOB DESCRIPTION — a posting that describes an open role the company is hiring for.

Classify documentType as:
- job_description: company/employer/recruiter text describing an open role, responsibilities, requirements, or how to apply. Includes LinkedIn/Indeed posts, internal reqs, agency briefs, and non-English postings.
- resume: a candidate's CV summarizing their own career, education, projects, and contact info.
- cover_letter: a candidate's application letter to an employer.
- other: unrelated documents (articles, invoices, contracts, code, etc.).
- unclear: too short, garbled, or impossible to tell.

Judge by author intent and structure, NOT keyword lists:
- JD = written by the hiring side about what they want in a hire.
- Resume = written by a person about their own history (often first person, employment timeline, personal contact links).

confidence is 0.0–1.0.

userMessage rules:
- job_description: brief neutral confirmation (e.g. "Valid job description.").
- resume: tell them this looks like a resume and they should upload the employer's JD.
- cover_letter / other / unclear: one clear sentence on what to upload instead.

Do not invent role details. detectedRoleTitle only if explicitly present.

Seniority detection (detectedSeniority):
- intern: internship, co-op, new grad programs with 0 yrs
- junior: entry-level, associate, 0–2 years, graduate roles
- mid: mid-level IC, typically 2–5 years, no Senior/Sr in title
- senior: Senior/Sr in title, or 5+ years required for IC roles
- staff: Staff Engineer, Principal Engineer, Distinguished
- lead: Team Lead, Engineering Manager, Head of, Director (people or tech lead)
- unknown: not stated and title gives no signal

yearsExperienceMin/Max: parse explicit ranges only (e.g. "3–5 years" → min 3 max 5). Null if absent.`

function sampleDocumentText(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= CLASSIFIER_SAMPLE_CHARS) return trimmed
  return `${trimmed.slice(0, CLASSIFIER_SAMPLE_CHARS)}\n\n[…document truncated for classification…]`
}

function toValidationResult(
  classification: DocumentClassification
): DocumentClassificationResult {
  const { documentType, confidence, userMessage } = classification

  if (documentType === "job_description" && confidence >= 0.65) {
    return { valid: true, classification }
  }

  if (documentType === "resume" && confidence >= 0.5) {
    return {
      valid: false,
      classification,
      error:
        userMessage ||
        "This looks like a resume. Please upload the employer's job description instead.",
    }
  }

  if (documentType === "job_description" && confidence >= 0.5) {
    return { valid: true, classification }
  }

  const fallbackErrors: Record<DocumentClassification["documentType"], string> =
    {
      job_description: "Please upload a clearer job description.",
      resume:
        "This looks like a resume. Please upload the employer's job description instead.",
      cover_letter:
        "This looks like a cover letter. Please upload the job description for the role.",
      other:
        "This doesn't look like a job description. Please upload the employer's JD.",
      unclear:
        "We couldn't tell what this document is. Please upload a clear job description.",
    }

  return {
    valid: false,
    classification,
    error: userMessage || fallbackErrors[documentType],
  }
}

export async function classifyJobDescriptionDocument(
  text: string
): Promise<DocumentClassificationResult> {
  const normalized = text.replace(/\s+/g, " ").trim()

  if (normalized.length < 80) {
    return {
      valid: false,
      classification: {
        documentType: "unclear",
        confidence: 0.9,
        userMessage:
          "Please upload a valid job description. The content is too short.",
        detectedRoleTitle: null,
        detectedSeniority: "unknown",
        yearsExperienceMin: null,
        yearsExperienceMax: null,
      },
      error: "Please upload a valid job description. The content is too short.",
    }
  }

  const settings = await getAiSettings()
  const chain = await resolveModelChain("public")
  const errors: string[] = []

  for (const entry of chain) {
    const start = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    try {
      const { object, usage } = await generateObject({
        model: entry.model,
        schema: documentClassificationSchema,
        system: CLASSIFIER_SYSTEM,
        prompt: `Classify this document:\n\n${sampleDocumentText(text)}`,
        temperature: 0,
        maxOutputTokens: 180,
        abortSignal: controller.signal,
        ...aiTelemetry("classify-job-description"),
      })

      void trackAiUsage({
        provider: entry.provider,
        model: entry.modelId,
        role: "generation",
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        latencyMs: Date.now() - start,
        success: true,
      })

      return toValidationResult(object)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "failed"
      errors.push(`${entry.provider}: ${msg}`)
      logger.error("[classify-jd] provider failed", {
        provider: entry.provider,
        model: entry.modelId,
        error: msg,
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(
    errors.length > 0
      ? "Couldn't validate the document. Please try again shortly."
      : "AI validation is not available."
  )
}
