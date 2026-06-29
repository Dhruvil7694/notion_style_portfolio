import { parseJobFitAnalysis } from "@/features/job-fit/lib/parse-job-fit-result"

export const JOB_FIT_HISTORY_KEY = "job_fit_history_v1"
export const MAX_JOB_FIT_HISTORY = 5

export type JobFitHistoryEntry = {
  id: string
  messageId: string
  contentHash?: string
  roleTitle: string
  fitScore: number
  fitScoreLabel: string
  analysisMarkdown: string
  createdAt: string
}

type StoredJobFitHistory = {
  version: 1
  entries: JobFitHistoryEntry[]
}

export function readJobFitHistory(): JobFitHistoryEntry[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(JOB_FIT_HISTORY_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as StoredJobFitHistory
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) return []

    return parsed.entries.slice(0, MAX_JOB_FIT_HISTORY)
  } catch {
    return []
  }
}

export function writeJobFitHistory(entries: JobFitHistoryEntry[]): void {
  if (typeof window === "undefined") return

  try {
    const payload: StoredJobFitHistory = {
      version: 1,
      entries: entries.slice(0, MAX_JOB_FIT_HISTORY),
    }
    window.localStorage.setItem(JOB_FIT_HISTORY_KEY, JSON.stringify(payload))
  } catch {
    // storage full or disabled
  }
}

export function clearJobFitHistoryStorage(): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(JOB_FIT_HISTORY_KEY)
  } catch {
    // ignore
  }
}

export function buildJobFitHistoryEntry(input: {
  messageId: string
  analysisMarkdown: string
  contentHash?: string
}): JobFitHistoryEntry | null {
  const parsed = parseJobFitAnalysis(input.analysisMarkdown)
  if (!parsed) return null

  return {
    id: crypto.randomUUID(),
    messageId: input.messageId,
    contentHash: input.contentHash,
    roleTitle: parsed.roleTitle,
    fitScore: parsed.fitScore,
    fitScoreLabel: parsed.fitScoreLabel,
    analysisMarkdown: input.analysisMarkdown,
    createdAt: new Date().toISOString(),
  }
}

export function appendJobFitHistoryEntry(
  entries: JobFitHistoryEntry[] | undefined,
  entry: JobFitHistoryEntry
): JobFitHistoryEntry[] {
  const current = entries ?? []

  if (current.some((item) => item.messageId === entry.messageId)) {
    return current
  }

  if (entry.contentHash) {
    const withoutDuplicate = current.filter(
      (item) => item.contentHash !== entry.contentHash
    )
    return [...withoutDuplicate, entry].slice(-MAX_JOB_FIT_HISTORY)
  }

  return [...current, entry].slice(-MAX_JOB_FIT_HISTORY)
}

export function findJobFitHistoryByContentHash(
  entries: JobFitHistoryEntry[] | undefined,
  contentHash: string
): JobFitHistoryEntry | undefined {
  return entries?.find((entry) => entry.contentHash === contentHash)
}

export function removeJobFitHistoryEntry(
  entries: JobFitHistoryEntry[] | undefined,
  entryId: string
): JobFitHistoryEntry[] {
  return (entries ?? []).filter((entry) => entry.id !== entryId)
}
