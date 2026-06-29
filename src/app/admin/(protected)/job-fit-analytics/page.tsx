import {
  AdminCallout,
  AdminDataTable,
  AdminPagination,
  AdminPanel,
  PageHeader,
  StatCard,
} from "@/features/admin/components"
import {
  getJobFitAnalyticsDashboard,
  getJobFitRecentEventsPaginated,
} from "@/features/admin/lib/job-fit-analytics-queries"
import type { JobFitAnalyticsEventType } from "@/features/job-fit/lib/analytics"
import {
  formatSeniorityLabel,
  isSeniorityLevel,
} from "@/features/portfolio/lib/job-seniority"
import { formatDateTime } from "@/shared/lib/utils"

export const dynamic = "force-dynamic"

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

type JobFitAnalyticsPageProps = {
  searchParams: Promise<{ ePage?: string }>
}

export default async function JobFitAnalyticsPage({
  searchParams,
}: JobFitAnalyticsPageProps) {
  const params = await searchParams

  const eventsPage = Math.max(1, parseInt(params.ePage ?? "1", 10) || 1)

  let dashboard

  let eventsPageData

  let loadError: string | null = null

  try {
    ;[dashboard, eventsPageData] = await Promise.all([
      getJobFitAnalyticsDashboard(30),

      getJobFitRecentEventsPaginated({ page: eventsPage, days: 30 }),
    ])
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load job fit analytics."
  }

  if (loadError || !dashboard || !eventsPageData) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="JD validations, fit scores, recruiter actions, and classifier feedback."
          title="Job Fit Analytics"
        />

        <AdminCallout
          title="Analytics table not available yet"
          variant="warning"
        >
          <p>
            Apply the latest Supabase migration{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              20250623100000_job_fit_analytics.sql
            </code>{" "}
            and refresh this page.
          </p>

          {loadError ? (
            <p className="mt-2 text-xs text-red-500/80">{loadError}</p>
          ) : null}
        </AdminCallout>
      </div>
    )
  }

  const { summary } = dashboard

  const { events: recentEvents } = eventsPageData

  return (
    <div className="space-y-6">
      <PageHeader
        description="JD validations, fit scores, recruiter actions, and classifier feedback from the public assistant."
        title="Job Fit Analytics"
      />

      <AdminPanel
        description={`Activity from the last ${summary.days} days.`}
        title="Summary"
      >
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
      </AdminPanel>

      {summary.topRoles.length > 0 ? (
        <AdminPanel title="Top analysed roles">
          <AdminDataTable>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b bg-muted/50">
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
                    className="border-border/60 border-b last:border-b-0"
                    key={row.roleTitle}
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
          </AdminDataTable>
        </AdminPanel>
      ) : null}

      {summary.seniorityBreakdown.length > 0 ? (
        <AdminPanel title="Seniority signals (JD validations)">
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
        </AdminPanel>
      ) : null}

      <AdminPanel
        description="8 events per page from the last 30 days."
        title="Recent events"
      >
        {recentEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No job fit analytics recorded yet. Events appear after recruiters
            validate JDs, run fit checks, export PDFs, or notify you.
          </p>
        ) : (
          <>
            <AdminDataTable>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">When</th>

                    <th className="px-4 py-3 text-left font-medium">Event</th>

                    <th className="px-4 py-3 text-left font-medium">Role</th>

                    <th className="px-4 py-3 text-right font-medium">Score</th>

                    <th className="px-4 py-3 text-left font-medium">
                      Seniority
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentEvents.map((event) => (
                    <tr
                      className="border-border/60 border-b last:border-b-0"
                      key={event.id}
                    >
                      <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
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
            </AdminDataTable>

            <AdminPagination
              basePath="/admin/job-fit-analytics"
              itemLabel="events"
              page={eventsPageData.page}
              paramName="ePage"
              totalCount={eventsPageData.totalCount}
              totalPages={eventsPageData.totalPages}
            />
          </>
        )}
      </AdminPanel>
    </div>
  )
}
