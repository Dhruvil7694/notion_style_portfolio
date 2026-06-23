import "server-only"

import type { JobFitAnalyticsEventRow } from "@/lib/job-fit/analytics"
import { createAdminClient } from "@/lib/supabase/admin"

export type JobFitAnalyticsSummary = {
  days: number
  jdValidations: number
  fitAnalyses: number
  employerNotifications: number
  pdfExports: number
  classificationFeedback: number
  averageFitScore: number | null
  highFitCount: number
  topRoles: { roleTitle: string; count: number; avgScore: number | null }[]
  seniorityBreakdown: { seniority: string; count: number }[]
}

export type JobFitAnalyticsDashboard = {
  summary: JobFitAnalyticsSummary
  recentEvents: JobFitAnalyticsEventRow[]
}

function sinceIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  )
}

export async function getJobFitAnalyticsDashboard(
  days = 30
): Promise<JobFitAnalyticsDashboard> {
  const supabase = createAdminClient()
  const since = sinceIso(days)

  const [{ data: events, error }, { data: recent, error: recentError }] =
    await Promise.all([
      supabase
        .from("job_fit_analytics_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_fit_analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
    ])

  if (error) {
    throw new Error(error.message)
  }
  if (recentError) {
    throw new Error(recentError.message)
  }

  const rows = (events ?? []) as JobFitAnalyticsEventRow[]
  const fitRows = rows.filter((row) => row.event_type === "fit_analysis")
  const fitScores = fitRows
    .map((row) => row.fit_score)
    .filter((score): score is number => score !== null)

  const roleMap = new Map<string, { count: number; scores: number[] }>()

  for (const row of fitRows) {
    if (!row.role_title) continue
    const existing = roleMap.get(row.role_title) ?? {
      count: 0,
      scores: [],
    }
    existing.count += 1
    if (row.fit_score !== null) existing.scores.push(row.fit_score)
    roleMap.set(row.role_title, existing)
  }

  const seniorityMap = new Map<string, number>()
  for (const row of rows) {
    if (!row.seniority || row.seniority === "unknown") continue
    seniorityMap.set(row.seniority, (seniorityMap.get(row.seniority) ?? 0) + 1)
  }

  const summary: JobFitAnalyticsSummary = {
    days,
    jdValidations: rows.filter((row) => row.event_type === "jd_validated")
      .length,
    fitAnalyses: fitRows.length,
    employerNotifications: rows.filter(
      (row) => row.event_type === "employer_notify"
    ).length,
    pdfExports: rows.filter((row) => row.event_type === "pdf_export").length,
    classificationFeedback: rows.filter(
      (row) => row.event_type === "classification_feedback"
    ).length,
    averageFitScore: average(fitScores),
    highFitCount: fitScores.filter((score) => score >= 75).length,
    topRoles: [...roleMap.entries()]
      .map(([roleTitle, value]) => ({
        roleTitle,
        count: value.count,
        avgScore: average(value.scores),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    seniorityBreakdown: [...seniorityMap.entries()]
      .map(([seniority, count]) => ({ seniority, count }))
      .sort((a, b) => b.count - a.count),
  }

  return {
    summary,
    recentEvents: (recent ?? []) as JobFitAnalyticsEventRow[],
  }
}
