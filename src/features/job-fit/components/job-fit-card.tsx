"use client"

import {
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Square,
  Upload,
  X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { JobDescriptionValidationResult } from "@/features/job-fit/lib/job-description"
import {
  extractTextFromJobDescriptionFile,
  hashJobDescriptionContent,
  JOB_DESCRIPTION_FILE_ACCEPT,
  reportJdClassificationFeedback,
  validateJobDescriptionText,
} from "@/features/job-fit/lib/job-description"
import type { JobFitHistoryEntry } from "@/features/job-fit/lib/job-fit-history"
import { findJobFitHistoryByContentHash } from "@/features/job-fit/lib/job-fit-history"
import type {
  JobFitSubmissionMeta,
  SeniorityLevel,
} from "@/features/portfolio/lib/job-seniority"
import { useSiteTheme } from "@/features/site-shell/components/site-theme-provider"
import { captureEvent } from "@/shared/lib/analytics/posthog-client"
import { cn } from "@/shared/lib/utils"

import {
  hasSeniorityMeta,
  JobFitRoleSeniorityLine,
} from "./job-fit-seniority-hint"

type JobFitCardProps = {
  onAnalyse: (jd: string, meta?: JobFitSubmissionMeta) => void
  onStop?: () => void
  isAnalysing?: boolean
  disabled?: boolean
  compact?: boolean
  sessionHistory?: JobFitHistoryEntry[]
}

type ValidationMeta = {
  documentType?: string
  confidence?: number
  valid: boolean
}

type ValidationCache = {
  hash: string
  result: JobDescriptionValidationResult
}

const PASTE_VALIDATE_DEBOUNCE_MS = 900

const DUPLICATE_JD_ERROR =
  "This JD is already in your session — upload a different role to compare."

function duplicateInSession(
  text: string,
  sessionHistory: JobFitHistoryEntry[]
): JobFitHistoryEntry | undefined {
  const trimmed = text.trim()
  if (!trimmed) return undefined
  return findJobFitHistoryByContentHash(
    sessionHistory,
    hashJobDescriptionContent(trimmed)
  )
}

function ReportingIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/55">
      <span aria-hidden className="flex items-center gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:120ms]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:240ms]" />
      </span>
      Reporting…
    </span>
  )
}

export function JobFitCard({
  onAnalyse,
  onStop,
  isAnalysing = false,
  disabled = false,
  compact = false,
  sessionHistory = [],
}: JobFitCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadedJdRef = useRef<string | null>(null)
  const validationCacheRef = useRef<ValidationCache | null>(null)
  const validationAbortRef = useRef<AbortController | null>(null)
  const validateGenerationRef = useRef(0)
  const extractGenerationRef = useRef(0)

  const [expanded, setExpanded] = useState(compact)
  const [pastedJd, setPastedJd] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [roleTitle, setRoleTitle] = useState<string | null>(null)
  const [seniority, setSeniority] = useState<SeniorityLevel>("unknown")
  const [yearsExperienceMin, setYearsExperienceMin] = useState<number | null>(
    null
  )
  const [yearsExperienceMax, setYearsExperienceMax] = useState<number | null>(
    null
  )
  const [validationMeta, setValidationMeta] = useState<ValidationMeta | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const seniorityMeta = {
    seniority,
    yearsExperienceMin,
    yearsExperienceMax,
  }

  const { theme } = useSiteTheme()
  const isDarkTheme = theme === "dark"

  const isBusy = isExtracting || isValidating || isAnalysing
  const canStop = isExtracting || isValidating || isAnalysing

  const hasUploadedFile = Boolean(uploadedFileName && uploadedJdRef.current)
  const hasContent = hasUploadedFile || Boolean(pastedJd.trim())

  const invalidateValidation = useCallback(() => {
    validationCacheRef.current = null
    setRoleTitle(null)
    setSeniority("unknown")
    setYearsExperienceMin(null)
    setYearsExperienceMax(null)
    setValidationMeta(null)
    setFeedbackSent(false)
  }, [])

  const stopLocalWork = useCallback(() => {
    validateGenerationRef.current += 1
    extractGenerationRef.current += 1
    validationAbortRef.current?.abort()
    validationAbortRef.current = null
    setIsValidating(false)
    setIsExtracting(false)
  }, [])

  const handleStop = useCallback(() => {
    if (isAnalysing) {
      onStop?.()
      return
    }
    stopLocalWork()
  }, [isAnalysing, onStop, stopLocalWork])

  const applyValidationResult = useCallback(
    (text: string, result: JobDescriptionValidationResult) => {
      validationCacheRef.current = {
        hash: hashJobDescriptionContent(text),
        result,
      }

      if (result.valid) {
        setRoleTitle(result.roleTitle)
        setSeniority(result.seniority)
        setYearsExperienceMin(result.yearsExperienceMin)
        setYearsExperienceMax(result.yearsExperienceMax)
        setValidationMeta({
          documentType: result.documentType,
          confidence: result.confidence,
          valid: true,
        })
        setError(null)
        return
      }

      setRoleTitle(null)
      setSeniority("unknown")
      setYearsExperienceMin(null)
      setYearsExperienceMax(null)
      setValidationMeta({
        documentType: result.documentType,
        confidence: result.confidence,
        valid: false,
      })
      setError(result.error)
    },
    []
  )

  const runValidation = useCallback(
    async (
      text: string,
      options?: { force?: boolean; silent?: boolean }
    ): Promise<JobDescriptionValidationResult | null> => {
      const duplicate = duplicateInSession(text, sessionHistory)
      if (duplicate) {
        setError(DUPLICATE_JD_ERROR)
        setRoleTitle(null)
        setSeniority("unknown")
        setYearsExperienceMin(null)
        setYearsExperienceMax(null)
        setValidationMeta(null)
        validationCacheRef.current = null
        return null
      }

      const hash = hashJobDescriptionContent(text)
      const cached = validationCacheRef.current

      if (!options?.force && cached?.hash === hash) {
        applyValidationResult(text, cached.result)
        return cached.result
      }

      const generation = ++validateGenerationRef.current
      validationAbortRef.current?.abort()
      const controller = new AbortController()
      validationAbortRef.current = controller

      setIsValidating(true)

      const result = await validateJobDescriptionText(text, controller.signal)

      if (generation !== validateGenerationRef.current) return null
      if ("aborted" in result) {
        setIsValidating(false)
        return null
      }

      setIsValidating(false)
      applyValidationResult(text, result)
      return result
    },
    [applyValidationResult, sessionHistory]
  )

  function clearUpload() {
    uploadedJdRef.current = null
    setUploadedFileName(null)
    invalidateValidation()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handlePaste(value: string) {
    setPastedJd(value)
    invalidateValidation()
    if (uploadedFileName) clearUpload()

    if (duplicateInSession(value, sessionHistory)) {
      setError(DUPLICATE_JD_ERROR)
      return
    }

    setError(null)
  }

  function resetCard() {
    setPastedJd("")
    setError(null)
    clearUpload()
    invalidateValidation()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    invalidateValidation()
    setPastedJd("")
    const generation = ++extractGenerationRef.current
    setIsExtracting(true)

    const result = await extractTextFromJobDescriptionFile(file)

    if (generation !== extractGenerationRef.current) return
    setIsExtracting(false)

    if ("error" in result) {
      setError(result.error)
      clearUpload()
      return
    }

    if (duplicateInSession(result.text, sessionHistory)) {
      setError(DUPLICATE_JD_ERROR)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    uploadedJdRef.current = result.text
    setUploadedFileName(file.name)
    setExpanded(true)
    void runValidation(result.text, { silent: true })
  }

  useEffect(() => {
    if (hasUploadedFile) return

    const trimmed = pastedJd.trim()
    if (trimmed.replace(/\s+/g, " ").length < 80) {
      invalidateValidation()
      return
    }

    if (duplicateInSession(trimmed, sessionHistory)) {
      setError(DUPLICATE_JD_ERROR)
      invalidateValidation()
      return
    }

    const timer = setTimeout(() => {
      void runValidation(trimmed, { silent: true })
    }, PASTE_VALIDATE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    pastedJd,
    hasUploadedFile,
    invalidateValidation,
    runValidation,
    sessionHistory,
  ])

  async function handleAnalyse() {
    const text = (uploadedJdRef.current ?? pastedJd).trim()
    if (
      !text ||
      disabled ||
      isAnalysing ||
      !validationMeta?.valid ||
      isValidating ||
      isExtracting
    ) {
      return
    }

    onAnalyse(text, {
      roleTitle,
      seniority,
      yearsExperienceMin,
      yearsExperienceMax,
    })
    resetCard()
    if (!compact) setExpanded(false)
  }

  async function handleReportWrong() {
    const text = (uploadedJdRef.current ?? pastedJd).trim()
    if (!text || !validationMeta || isReporting) return

    const payload = {
      contentHash: hashJobDescriptionContent(text),
      predictedDocumentType: validationMeta.documentType ?? "unknown",
      confidence: validationMeta.confidence ?? 0,
      wasValid: validationMeta.valid,
      roleTitle,
      seniority: seniority !== "unknown" ? seniority : undefined,
      yearsExperienceMin,
      yearsExperienceMax,
      contentPreview: text.slice(0, 280),
    }

    setIsReporting(true)

    try {
      const result = await reportJdClassificationFeedback(payload)
      if (!result.ok) {
        setError(result.error)
        return
      }

      captureEvent("jd_classification_feedback", {
        content_hash: payload.contentHash,
        predicted_document_type: payload.predictedDocumentType,
        confidence: payload.confidence,
        was_valid: payload.wasValid,
        role_title: payload.roleTitle,
      })

      setFeedbackSent(true)
    } finally {
      setIsReporting(false)
    }
  }

  if (!expanded && !compact) {
    return (
      <button
        className={cn(
          "mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-2.5 rounded-xl border border-dashed",
          "border-border/60 bg-muted/10 px-3.5 py-3 text-left transition-colors",
          "hover:border-border hover:bg-muted/20"
        )}
        onClick={() => setExpanded(true)}
        type="button"
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
          <Briefcase className="size-3.5 text-foreground/60" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-foreground/80">
            Check Job Fit
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            Upload or paste a JD — get a match score
          </p>
        </div>
      </button>
    )
  }

  const showValidatedState =
    validationMeta?.valid && !isValidating && !isExtracting

  const currentJdText = (uploadedJdRef.current ?? pastedJd).trim()

  const canAnalyse =
    hasContent &&
    !disabled &&
    showValidatedState &&
    !duplicateInSession(currentJdText, sessionHistory)

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border/60 bg-muted/10 p-3.5",
        compact ? "mx-0 mb-0" : "mx-4 mb-3"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="size-3.5 text-foreground/60" />
          <p className="text-[12px] font-medium text-foreground/80">
            Job Description
          </p>
        </div>
        {!compact && (
          <button
            aria-label="Close"
            className="text-muted-foreground/40 hover:text-muted-foreground"
            onClick={() => {
              setExpanded(false)
              resetCard()
            }}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {hasUploadedFile ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2
              className={cn(
                "size-4 shrink-0",
                showValidatedState
                  ? isDarkTheme
                    ? "text-green-400"
                    : "text-foreground"
                  : "text-muted-foreground/40"
              )}
            />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-foreground/85">
                {uploadedFileName}
              </p>
              <div
                className={cn(
                  "text-[10px]",
                  showValidatedState
                    ? isDarkTheme
                      ? "text-green-400/90"
                      : "text-foreground"
                    : "text-muted-foreground/55"
                )}
              >
                {isValidating ? (
                  "Checking document…"
                ) : showValidatedState ? (
                  roleTitle ||
                  seniorityMeta.seniority !== "unknown" ||
                  seniorityMeta.yearsExperienceMin != null ||
                  seniorityMeta.yearsExperienceMax != null ? (
                    <JobFitRoleSeniorityLine
                      meta={seniorityMeta}
                      roleTitle={roleTitle}
                    />
                  ) : (
                    "Valid job description — ready to analyse"
                  )
                ) : (
                  "Uploaded — checking document…"
                )}
              </div>
            </div>
          </div>
          <button
            aria-label="Remove uploaded file"
            className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground"
            disabled={disabled || isBusy}
            onClick={clearUpload}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <textarea
          className={cn(
            "max-h-[140px] min-h-[100px] w-full resize-none overflow-y-auto overscroll-contain",
            "rounded-lg border border-border/40 bg-background px-3 py-2",
            "text-[12px] text-foreground placeholder:text-muted-foreground/40",
            "focus:border-border/70 focus:outline-none",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            (disabled || isBusy) && "opacity-50"
          )}
          disabled={disabled || isBusy}
          onChange={(e) => handlePaste(e.target.value)}
          onWheel={(e) => e.stopPropagation()}
          placeholder="Paste the job description here, or upload a PDF / text file…"
          value={pastedJd}
        />
      )}

      {!hasUploadedFile &&
      showValidatedState &&
      (roleTitle || hasSeniorityMeta(seniorityMeta)) ? (
        <div
          className={cn(
            "flex items-start gap-1.5 text-[11px]",
            isDarkTheme ? "text-green-400/90" : "text-foreground"
          )}
        >
          <Check className="mt-0.5 size-3 shrink-0" />
          <JobFitRoleSeniorityLine meta={seniorityMeta} roleTitle={roleTitle} />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <input
            ref={fileInputRef}
            accept={JOB_DESCRIPTION_FILE_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            type="file"
          />
          <button
            aria-label="Upload job description"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5",
              "text-[11px] text-muted-foreground transition-colors hover:bg-muted/40",
              (disabled || isBusy) && "pointer-events-none opacity-50"
            )}
            disabled={disabled || isBusy}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="size-3.5" />
            {isExtracting ? "Reading file…" : "Upload JD"}
          </button>
          {isExtracting && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <FileText className="size-3 shrink-0" />
              Extracting text…
            </span>
          )}
          {isValidating && !isAnalysing && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <FileText className="size-3 shrink-0" />
              Checking document…
            </span>
          )}
          {isAnalysing && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              Analysing fit…
            </span>
          )}
        </div>

        {canStop ? (
          <button
            aria-label="Stop"
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5",
              "text-[12px] font-medium text-foreground transition-colors hover:bg-muted/40"
            )}
            onClick={handleStop}
            type="button"
          >
            <Square className="size-3 fill-current" />
            Stop
          </button>
        ) : (
          <button
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all",
              canAnalyse
                ? "bg-foreground text-background hover:opacity-80"
                : "cursor-not-allowed bg-muted/40 text-muted-foreground/40"
            )}
            disabled={!canAnalyse}
            onClick={handleAnalyse}
            type="button"
          >
            Analyse Fit
          </button>
        )}
      </div>

      {error && (
        <p className="text-[11px] leading-relaxed text-red-500/90" role="alert">
          {error}
        </p>
      )}

      {validationMeta && !isValidating && !feedbackSent && (
        <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2.5">
          {validationMeta.valid ? (
            <p
              className={cn(
                "flex items-center gap-1.5 text-[10px]",
                isDarkTheme ? "text-green-400" : "text-foreground"
              )}
            >
              <Check className="size-3 shrink-0" />
              Document verified
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/45">
              Classification available
            </p>
          )}
          {isReporting ? (
            <ReportingIndicator />
          ) : (
            <button
              className="text-[10px] text-muted-foreground/55 underline-offset-2 hover:text-muted-foreground hover:underline"
              onClick={handleReportWrong}
              type="button"
            >
              Wrong? Report
            </button>
          )}
        </div>
      )}

      {feedbackSent && (
        <p className="text-[10px] text-muted-foreground/55">
          Thanks — feedback recorded.
        </p>
      )}
    </div>
  )
}
