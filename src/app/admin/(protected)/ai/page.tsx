import { PageHeader, StatCard } from "@/components/admin"
import {
  getAiRecentErrors,
  getAiUsageSummary,
  getAiUsageTimeSeries,
} from "@/lib/admin/ai-usage-queries"

export const metadata = {
  title: "AI Usage",
  robots: { index: false, follow: false },
}

export default async function AiUsagePage() {
  const [summary, timeSeries, errors] = await Promise.all([
    getAiUsageSummary(7),
    getAiUsageTimeSeries(7),
    getAiRecentErrors(10),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        description="Provider usage, token consumption, and cost tracking."
        title="AI Usage"
      />

      {/* Summary stats */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Last 7 Days</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Requests" value={summary.totalRequests} />
          <StatCard
            label="Success Rate"
            value={`${summary.successRate.toFixed(1)}%`}
          />
          <StatCard
            label="Est. Cost"
            value={`$${summary.estimatedCost.toFixed(4)}`}
          />
          <StatCard label="Avg Latency" value={`${summary.avgLatencyMs}ms`} />
        </div>
      </section>

      {/* Token usage */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Token Usage</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Input Tokens"
            value={summary.totalInputTokens.toLocaleString()}
          />
          <StatCard
            label="Output Tokens"
            value={summary.totalOutputTokens.toLocaleString()}
          />
          <StatCard label="Failover Count" value={summary.failoverCount} />
        </div>
      </section>

      {/* By provider */}
      {summary.byProvider.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">By Provider</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Requests
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Est. Cost
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Avg Latency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.byProvider.map((p) => (
                  <tr
                    key={p.provider}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.provider}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ${p.cost.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.avgLatency}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* By model */}
      {summary.byModel.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">By Model</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Requests
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.byModel.map((m) => (
                  <tr
                    key={m.model}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{m.model}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {m.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* By role */}
      {summary.byRole.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">By Role</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Requests
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.byRole.map((r) => (
                  <tr
                    key={r.role}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 capitalize">{r.role}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Time series */}
      {timeSeries.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">Daily Breakdown</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Requests
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Tokens</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timeSeries.map((row) => (
                  <tr
                    key={row.date}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 tabular-nums">{row.date}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.requests}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ${row.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent errors */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Recent Errors</h2>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No errors in the last 7 days.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-left font-medium">Error</th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errors.map((e, i) => (
                  <tr
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {e.provider}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.model}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-destructive">
                      {e.error_message}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                      {new Date(e.created_at).toLocaleString()}
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
