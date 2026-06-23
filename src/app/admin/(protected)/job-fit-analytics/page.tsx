import { PageHeader, StatCard } from "@/components/admin"
import { getJobFitAnalyticsDashboard } from "@/lib/admin/job-fit-analytics-queries"
import type { JobFitAnalyticsEventType } from "@/lib/job-fit/analytics"
import {
  formatSeniorityLabel,
  isSeniorityLevel,
} from "@/lib/public/job-seniority"
import { formatDateTime } from "@/lib/utils"

export const metadata = {
  title: "Job Fit Analytics",
  robots: { index: false, follow: false },
}

const EVENT_LABELS: Record<JobFitAnalyticsEventType, string> = {
  jd_validated: "JD validated",
  fit_analysis: "Fit analysis",
  employer_notify: "Employer notify",
  pdf_export: "PDF export",
  classification_feedback: "Classifier feedback",
}

function eventLabel(type: JobFitAnalyticsEventType): string {
  return EVENT_LABELS[type] ?? type
}

export default async function JobFitAnalyticsPage() {
  let dashboard
  let loadError: string | null = null

  try {
    dashboard = await getJobFitAnalyticsDashboard(30)
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load job fit analytics."
  }

  if (loadError || !dashboard) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="JD validations, fit scores, recruiter actions, and classifier feedback."
          title="Job Fit Analytics"
        />
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Analytics table not available yet
          </p>
          <p className="mt-2">
            Apply the latest Supabase migration{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              20250623100000_job_fit_analytics.sql
            </code>{" "}
            and refresh this page.
          </p>
          {loadError ? (
            <p className="mt-2 text-xs text-red-500/80">{loadError}</p>
          ) : null}
        </div>
      </div>
    )
  }

  const { summary, recentEvents } = dashboard

  return (
    <div className="space-y-8">
      <PageHeader
        description="JD validations, fit scores, recruiter actions, and classifier feedback from the public assistant."
        title="Job Fit Analytics"
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Last {summary.days} days</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="JD validations" value={summary.jdValidations} />
          <StatCard label="Fit analyses" value={summary.fitAnalyses} />
          <StatCard
            label="Avg fit score"
            value={
              summary.averageFitScore !== null
                ? `${summary.averageFitScore}%`
                : "—"
            }
          />
          <StatCard label="High-fit (≥75%)" value={summary.highFitCount} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Employer notifications"
            value={summary.employerNotifications}
          />
          <StatCard label="PDF exports" value={summary.pdfExports} />
          <StatCard
            label="Classifier feedback"
            value={summary.classificationFeedback}
          />
        </div>
      </section>

      {summary.topRoles.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">Top analysed roles</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-right font-medium">Analyses</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Avg score
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.topRoles.map((row) => (
                  <tr
                    key={row.roleTitle}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td className="px-4 py-3">{row.roleTitle}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.avgScore !== null ? `${row.avgScore}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {summary.seniorityBreakdown.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">
            Seniority signals (JD validations)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.seniorityBreakdown.map((row) => (
              <StatCard
                key={row.seniority}
                label={
                  isSeniorityLevel(row.seniority)
                    ? formatSeniorityLabel(row.seniority)
                    : row.seniority
                }
                value={row.count}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Recent events</h2>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No job fit analytics recorded yet. Events appear after recruiters
            validate JDs, run fit checks, export PDFs, or notify you.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">Seniority</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(event.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {eventLabel(event.event_type)}
                    </td>
                    <td className="px-4 py-3">{event.role_title ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {event.fit_score !== null ? `${event.fit_score}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {event.seniority && isSeniorityLevel(event.seniority)
                        ? formatSeniorityLabel(event.seniority)
                        : (event.seniority ?? "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
