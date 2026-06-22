import { PageHeader, StatCard } from "@/components/admin"
import {
  getPostHogConfig,
  validatePostHogEvents,
} from "@/lib/debug/posthog-validation"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Analytics Validation",
  robots: { index: false, follow: false },
}

function StatusBadge({
  status,
}: {
  status: "pass" | "no-data" | "unconfigured"
}) {
  if (status === "pass")
    return (
      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
        PASS
      </span>
    )
  if (status === "unconfigured")
    return (
      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        NOT CONFIGURED
      </span>
    )
  return (
    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
      NO DATA YET
    </span>
  )
}

function formatLastSeen(ts: string | null): string {
  if (!ts) return "—"
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ts
  }
}

export default async function AnalyticsValidationPage() {
  const { projectId, apiKey } = getPostHogConfig()

  if (!apiKey || !projectId) {
    return (
      <div className="space-y-8">
        <PageHeader
          description="Verify every analytics event is reaching PostHog."
          title="Analytics Validation"
        />
        <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-sm dark:border-red-800 dark:bg-red-900/20">
          <p className="font-semibold text-red-700 dark:text-red-400">
            ✗ PostHog not configured
          </p>
          <p className="mt-1 text-red-600 dark:text-red-300">
            Add <code>POSTHOG_API_KEY</code> (personal API key) and{" "}
            <code>POSTHOG_PROJECT_ID</code> (e.g. 439834) to your environment
            variables.
          </p>
        </div>
      </div>
    )
  }

  const results = await validatePostHogEvents(projectId, apiKey)

  const passed = results.filter((r) => r.status === "pass").length
  const noData = results.filter((r) => r.status === "no-data").length
  const total = results.length
  const overallStatus =
    passed === total ? "PASS" : passed > 0 ? "PARTIAL" : "NO DATA"

  return (
    <div className="space-y-8">
      <PageHeader
        description="Verify every analytics event is reaching PostHog (last 30 days)."
        title="Analytics Validation"
      />

      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Events" value={total} />
          <StatCard label="Receiving Data" value={passed} />
          <StatCard label="No Data Yet" value={noData} />
          <StatCard label="Overall" value={overallStatus} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Event Status</h2>
          <span className="text-xs text-muted-foreground">
            Project {projectId} · Last 30 days
          </span>
        </div>

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Count</th>
                <th className="px-4 py-2 font-medium">Last Seen</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr className="border-b last:border-0" key={r.event}>
                  <td className="px-4 py-3 font-mono text-xs">{r.event}</td>
                  <td className="px-4 py-3 font-mono">
                    {r.count > 0 ? r.count.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatLastSeen(r.lastSeen)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {noData > 0 && (
        <section className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            NO DATA events are expected pre-launch.
          </p>
          <p>
            Events only appear after real user traffic hits production. Re-run
            this page after deployment.
          </p>
          <p>
            Dashboard:{" "}
            <a
              className="underline"
              href="https://us.posthog.com/project/439834/dashboard/1745788"
              rel="noopener noreferrer"
              target="_blank"
            >
              Portfolio Analytics (wizard)
            </a>
          </p>
        </section>
      )}
    </div>
  )
}
