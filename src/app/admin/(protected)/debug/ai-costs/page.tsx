import { PageHeader, StatCard } from "@/components/admin"
import { getAiUsageSummary } from "@/lib/admin/ai-usage-queries"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "AI Cost Verification",
  robots: { index: false, follow: false },
}

const PROVIDER_DASHBOARDS: Record<string, string> = {
  openai: "https://platform.openai.com/usage",
  anthropic: "https://console.anthropic.com/settings/usage",
  openrouter: "https://openrouter.ai/activity",
  groq: "https://console.groq.com/",
  google:
    "https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com",
  nvidia: "https://build.nvidia.com/",
}

function varianceColor(pct: number): string {
  if (pct <= 10) return "text-green-600 dark:text-green-400"
  if (pct <= 25) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

function varianceBadge(pct: number): string {
  if (pct <= 10) return "✓ OK"
  if (pct <= 25) return "⚠ HIGH"
  return "✗ ALERT"
}

export default async function AiCostsPage() {
  const summary30 = await getAiUsageSummary(30)
  const summary7 = await getAiUsageSummary(7)

  return (
    <div className="space-y-8">
      <PageHeader
        description="Compare tracked token costs against provider dashboards. Target: variance < 10%."
        title="AI Cost Verification"
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Last 30 Days — Totals</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={summary30.totalRequests.toLocaleString()}
          />
          <StatCard
            label="Tracked Cost"
            value={`$${summary30.estimatedCost.toFixed(4)}`}
          />
          <StatCard
            label="Input Tokens"
            value={summary30.totalInputTokens.toLocaleString()}
          />
          <StatCard
            label="Output Tokens"
            value={summary30.totalOutputTokens.toLocaleString()}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Last 7 Days — By Provider</h2>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Requests</th>
                <th className="px-4 py-2 font-medium">Tracked Cost</th>
                <th className="px-4 py-2 font-medium">Avg Latency</th>
                <th className="px-4 py-2 font-medium">Dashboard</th>
              </tr>
            </thead>
            <tbody>
              {summary7.byProvider.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No AI usage logged in the last 7 days
                  </td>
                </tr>
              ) : (
                summary7.byProvider.map((p) => (
                  <tr className="border-b last:border-0" key={p.provider}>
                    <td className="px-4 py-3 font-medium capitalize">
                      {p.provider}
                    </td>
                    <td className="px-4 py-3 font-mono">{p.count}</td>
                    <td className="px-4 py-3 font-mono">
                      ${p.cost.toFixed(5)}
                    </td>
                    <td className="px-4 py-3 font-mono">{p.avgLatency}ms</td>
                    <td className="px-4 py-3">
                      {PROVIDER_DASHBOARDS[p.provider.toLowerCase()] ? (
                        <a
                          className="text-xs text-primary underline"
                          href={PROVIDER_DASHBOARDS[p.provider.toLowerCase()]}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View dashboard ↗
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Variance Calculation</h2>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-3">
          <p className="text-muted-foreground">
            Variance = |tracked − actual| / actual × 100. Target: &lt;10%.
          </p>
          <p className="font-medium">How to verify:</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground text-xs">
            <li>
              Copy &quot;Tracked Cost&quot; per provider from the table above
            </li>
            <li>
              Open the provider dashboard link → note actual spend for same
              period
            </li>
            <li>Calculate: variance = |tracked − actual| / actual × 100%</li>
            <li>
              If variance &gt; 10%: check <code>cost_estimate</code> formula in{" "}
              <code>src/lib/ai/providers/adapters.ts</code>
            </li>
          </ol>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center gap-3">
              <span className={varianceColor(5)}>{varianceBadge(5)}</span>
              <span className="text-muted-foreground">≤10% — acceptable</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={varianceColor(15)}>{varianceBadge(15)}</span>
              <span className="text-muted-foreground">
                11–25% — investigate
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={varianceColor(30)}>{varianceBadge(30)}</span>
              <span className="text-muted-foreground">
                &gt;25% — fix cost formula
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">30-Day — By Provider Breakdown</h2>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Requests</th>
                <th className="px-4 py-2 font-medium">Tracked Cost</th>
                <th className="px-4 py-2 font-medium">Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              {summary30.byProvider.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No data yet
                  </td>
                </tr>
              ) : (
                summary30.byProvider.map((p) => (
                  <tr className="border-b last:border-0" key={p.provider}>
                    <td className="px-4 py-3 font-medium capitalize">
                      {p.provider}
                    </td>
                    <td className="px-4 py-3 font-mono">{p.count}</td>
                    <td className="px-4 py-3 font-mono">
                      ${p.cost.toFixed(5)}
                    </td>
                    <td className="px-4 py-3 font-mono">{p.avgLatency}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
