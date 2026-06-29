import type { SeniorityLevel } from "@/features/portfolio/lib/job-seniority"
import { isSeniorityLevel } from "@/features/portfolio/lib/job-seniority"

export type JobDescriptionValidationResult =
  | {
      valid: true
      documentType: string
      confidence: number
      roleTitle: string | null
      seniority: SeniorityLevel
      yearsExperienceMin: number | null
      yearsExperienceMax: number | null
    }
  | {
      valid: false
      error: string
      documentType?: string
      confidence?: number
    }

export function hashJobDescriptionContent(text: string): string {
  const normalized = text.trim()
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

type ValidateApiResponse =
  | {
      valid: true
      documentType: string
      confidence: number
      roleTitle?: string | null
      seniority?: string
      yearsExperienceMin?: number | null
      yearsExperienceMax?: number | null
    }
  | {
      valid: false
      documentType?: string
      confidence?: number
      message?: string
      error?: string
    }

export async function validateJobDescriptionText(
  text: string,
  signal?: AbortSignal
): Promise<JobDescriptionValidationResult | { aborted: true }> {
  const normalized = text.replace(/\s+/g, " ").trim()

  if (normalized.length < 80) {
    return {
      valid: false,
      error: "Please upload a valid job description. The content is too short.",
    }
  }

  if (signal?.aborted) return { aborted: true }

  try {
    const res = await fetch("/api/chat/validate-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    })

    const data = (await res.json()) as ValidateApiResponse

    if (!res.ok) {
      return {
        valid: false,
        error:
          ("error" in data && data.error) ||
          "Couldn't validate the document. Please try again.",
      }
    }

    if (data.valid) {
      const rawSeniority = data.seniority ?? "unknown"
      const seniority: SeniorityLevel = isSeniorityLevel(rawSeniority)
        ? rawSeniority
        : "unknown"

      return {
        valid: true,
        documentType: data.documentType,
        confidence: data.confidence,
        roleTitle: data.roleTitle ?? null,
        seniority,
        yearsExperienceMin: data.yearsExperienceMin ?? null,
        yearsExperienceMax: data.yearsExperienceMax ?? null,
      }
    }

    return {
      valid: false,
      error:
        data.message ||
        "Please upload a valid job description from the employer.",
      documentType: data.documentType,
      confidence: data.confidence,
    }
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return { aborted: true }
    }
    return {
      valid: false,
      error: "Couldn't validate the document. Check your connection and retry.",
    }
  }
}

export type JdClassificationFeedbackPayload = {
  contentHash: string
  predictedDocumentType: string
  confidence: number
  wasValid: boolean
  roleTitle?: string | null
  seniority?: SeniorityLevel
  yearsExperienceMin?: number | null
  yearsExperienceMax?: number | null
  contentPreview?: string
}

export async function reportJdClassificationFeedback(
  payload: JdClassificationFeedbackPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/chat/validate-jd-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: data.error ?? "Couldn't send feedback." }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      error: "Couldn't send feedback. Check your connection.",
    }
  }
}
