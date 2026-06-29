import {
  Bot,
  BrainCircuit,
  ExternalLink,
  FileSearch,
  Flame,
  Globe,
  Layers,
  type LucideIcon,
  MessageSquare,
  Pencil,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react"
import Link from "next/link"

import {
  AdminDataTable,
  AdminPanel,
  PageHeader,
  StatCard,
} from "@/features/admin/components"
import { AiUsageCharts } from "@/features/admin/components/ai-usage-charts"
import { AiUsageDailyBreakdownPanel } from "@/features/admin/components/ai-usage-daily-panel"
import {
  AiUsageLiveIndicator,
  AiUsageLiveShell,
} from "@/features/admin/components/ai-usage-live-shell"
import {
  AiUsageCostVerificationPanel,
  AiUsageQueriesPanel,
} from "@/features/admin/components/ai-usage-queries-panel"
import { AiUsageTabNav } from "@/features/admin/components/ai-usage-tab-nav"
import { formatAdminDateTime } from "@/features/admin/lib/admin-datetime"
import { providerDashboardUrl } from "@/features/admin/lib/ai-cost-verification"
import {
  getAiRecentErrors,
  getAiUsageLogsForVerification,
  getAiUsageLogsPaginated,
  getAiUsageSummary,
  getAiUsageTimeSeries,
  getAiUsageTimeSeriesPaginated,
} from "@/features/admin/lib/ai-usage-queries"
import { parseAiUsageTab } from "@/features/admin/lib/ai-usage-tabs"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "AI Usage",
  robots: { index: false, follow: false },
}

type AiUsagePageProps = {
  searchParams: Promise<{ tab?: string; qPage?: string; tsPage?: string }>
}

export default async function AiUsagePage({ searchParams }: AiUsagePageProps) {
  const params = await searchParams
  const activeTab = parseAiUsageTab(params.tab)
  const queryPage = Math.max(1, parseInt(params.qPage ?? "1", 10) || 1)
  const tsPage = Math.max(1, parseInt(params.tsPage ?? "1", 10) || 1)

  const emptyLogsPage = {
    logs: [],
    page: 1,
    pageSize: 8,
    totalCount: 0,
    totalPages: 0,
  }
  const emptyTsPage = {
    entries: [],
    page: 1,
    pageSize: 8,
    totalCount: 0,
    totalPages: 0,
  }

  const [
    summary7,
    summary30,
    timeSeries,
    errors,
    queryLogs,
    dailySeries,
    allTimeSeries,
    allQueryLogs,
  ] = await Promise.all([
    getAiUsageSummary(7),
    getAiUsageSummary(30),
    activeTab === "overview" ? getAiUsageTimeSeries(7) : Promise.resolve([]),
    getAiRecentErrors(10),
    activeTab === "queries"
      ? getAiUsageLogsPaginated({ days: 7, page: queryPage })
      : Promise.resolve(emptyLogsPage),
    activeTab === "analysis"
      ? getAiUsageTimeSeriesPaginated({ days: 7, page: tsPage })
      : Promise.resolve(emptyTsPage),
    activeTab === "analysis" ? getAiUsageTimeSeries(7) : Promise.resolve([]),
    activeTab === "queries"
      ? getAiUsageLogsForVerification(7)
      : Promise.resolve([]),
  ])

  return (
    <AiUsageLiveShell>
      <div className="space-y-6">
        <PageHeader
          actions={<AiUsageLiveIndicator />}
          description="Provider usage, token consumption, cost tracking, and cost verification."
          title="AI Usage"
        />

        <AiUsageTabNav activeTab={activeTab} queryPage={queryPage} />

        {activeTab === "overview" ? (
          <>
            <AdminPanel
              description="Request volume, success rate, cost, and latency."
              title="Last 7 days"
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total requests"
                  value={summary7.totalRequests}
                />
                <StatCard
                  label="Success rate"
                  value={`${summary7.successRate.toFixed(1)}%`}
                />
                <StatCard
                  label="Tracked cost"
                  value={`$${summary7.estimatedCost.toFixed(4)}`}
                />
                <StatCard
                  label="Avg latency"
                  value={`${summary7.avgLatencyMs}ms`}
                />
              </div>
            </AdminPanel>

            <AdminPanel
              description="Input/output tokens and provider failovers."
              title="Token usage"
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label="Input tokens"
                  value={summary7.totalInputTokens.toLocaleString("en-US")}
                />
                <StatCard
                  label="Output tokens"
                  value={summary7.totalOutputTokens.toLocaleString("en-US")}
                />
                <StatCard
                  label="Failover count"
                  value={summary7.failoverCount}
                />
              </div>
            </AdminPanel>

            <AdminPanel
              description="Visual breakdown of requests, cost, and role distribution."
              title="Charts"
            >
              <AiUsageCharts
                byProvider={summary7.byProvider}
                byRole={summary7.byRole}
                timeSeries={timeSeries}
              />
            </AdminPanel>
          </>
        ) : null}

        {activeTab === "queries" ? (
          <AdminPanel
            description="Click any row to open a per-query cost breakdown. 8 queries per page."
            title="Query log"
          >
            <AiUsageQueriesPanel
              allLogs={allQueryLogs}
              days={7}
              logs={queryLogs.logs}
              page={queryLogs.page}
              totalCount={queryLogs.totalCount}
              totalPages={queryLogs.totalPages}
            />
          </AdminPanel>
        ) : null}

        {activeTab === "costs" ? (
          <>
            <AdminPanel
              description="One-click audit: recompute costs from token counts and model rates."
              title="Cost verification"
            >
              <AiUsageCostVerificationPanel days={7} />
            </AdminPanel>

            <AdminPanel
              description="Compare tracked totals with provider billing dashboards."
              title="Provider totals (7 days)"
            >
              <ProviderTable providers={summary7.byProvider} showDashboard />
            </AdminPanel>

            <AdminPanel
              description="Aggregate usage and cost over the last 30 days."
              title="Last 30 days — totals"
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total requests"
                  value={summary30.totalRequests.toLocaleString("en-US")}
                />
                <StatCard
                  label="Tracked cost"
                  value={`$${summary30.estimatedCost.toFixed(4)}`}
                />
                <StatCard
                  label="Input tokens"
                  value={summary30.totalInputTokens.toLocaleString("en-US")}
                />
                <StatCard
                  label="Output tokens"
                  value={summary30.totalOutputTokens.toLocaleString("en-US")}
                />
              </div>
            </AdminPanel>

            {summary30.byProvider.length > 0 ? (
              <AdminPanel title="Last 30 days — by provider">
                <ProviderTable providers={summary30.byProvider} />
              </AdminPanel>
            ) : null}
          </>
        ) : null}

        {activeTab === "analysis" ? (
          <>
            {summary7.byModel.length > 0 || summary7.byRole.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {summary7.byModel.length > 0 ? (
                  <AdminPanel title="By model (7 days)">
                    <IconCountGrid
                      rows={summary7.byModel.map((row) => ({
                        key: row.model,
                        label: row.model,
                        count: row.count,
                        icon: modelIcon(row.model),
                        mono: true,
                      }))}
                    />
                  </AdminPanel>
                ) : null}

                {summary7.byRole.length > 0 ? (
                  <AdminPanel title="By role (7 days)">
                    <IconCountGrid
                      rows={summary7.byRole.map((row) => ({
                        key: row.role,
                        label: row.role,
                        count: row.count,
                        icon: roleIcon(row.role),
                        capitalize: true,
                      }))}
                    />
                  </AdminPanel>
                ) : null}
              </div>
            ) : null}

            {dailySeries.totalCount > 0 ? (
              <AdminPanel
                description="Click any row to see derived metrics. 8 days per page."
                title="Daily breakdown (7 days)"
              >
                <AiUsageDailyBreakdownPanel
                  allEntries={allTimeSeries}
                  entries={dailySeries.entries}
                  page={dailySeries.page}
                  totalCount={dailySeries.totalCount}
                  totalPages={dailySeries.totalPages}
                />
              </AdminPanel>
            ) : null}

            {summary7.byModel.length === 0 &&
            summary7.byRole.length === 0 &&
            dailySeries.totalCount === 0 ? (
              <AdminPanel title="Analysis">
                <p className="text-muted-foreground text-sm">
                  No analysis data yet. Run some AI requests first.
                </p>
              </AdminPanel>
            ) : null}
          </>
        ) : null}

        {activeTab === "errors" ? (
          <AdminPanel title="Recent errors">
            {errors.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No errors in the last 7 days.
              </p>
            ) : (
              <AdminDataTable>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">
                        Provider
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Model</th>
                      <th className="px-4 py-3 text-left font-medium">Error</th>
                      <th className="px-4 py-3 text-right font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {errors.map((error, index) => (
                      <tr
                        className="hover:bg-muted/30 transition-colors"
                        key={`${error.created_at}-${index}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {error.provider}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {error.model}
                        </td>
                        <td className="text-destructive max-w-xs truncate px-4 py-3">
                          {error.error_message}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                          {formatAdminDateTime(error.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminDataTable>
            )}
          </AdminPanel>
        ) : null}
      </div>
    </AiUsageLiveShell>
  )
}

type ProviderRow = {
  provider: string
  count: number
  cost: number
  avgLatency: number
}

function ProviderTable({
  providers,
  showDashboard = false,
}: {
  providers: ProviderRow[]
  showDashboard?: boolean
}) {
  return (
    <AdminDataTable>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Provider</th>
            <th className="px-4 py-3 text-right font-medium">Requests</th>
            <th className="px-4 py-3 text-right font-medium">Tracked cost</th>
            <th className="px-4 py-3 text-right font-medium">Avg latency</th>
            {showDashboard ? (
              <th className="px-4 py-3 text-left font-medium">Dashboard</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {providers.length === 0 ? (
            <tr>
              <td
                className="text-muted-foreground px-4 py-6 text-center"
                colSpan={showDashboard ? 5 : 4}
              >
                No AI usage logged
              </td>
            </tr>
          ) : (
            providers.map((provider) => {
              const dashboardUrl = providerDashboardUrl(provider.provider)
              return (
                <tr
                  className="hover:bg-muted/30 transition-colors"
                  key={provider.provider}
                >
                  <td className="px-4 py-3 font-medium capitalize">
                    {provider.provider}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {provider.count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    ${provider.cost.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {provider.avgLatency}ms
                  </td>
                  {showDashboard ? (
                    <td className="px-4 py-3">
                      {dashboardUrl ? (
                        <Link
                          className="text-primary inline-flex items-center gap-1 text-xs underline"
                          href={dashboardUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View dashboard
                          <ExternalLink aria-hidden className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </AdminDataTable>
  )
}

function modelIcon(model: string): LucideIcon {
  const m = model.toLowerCase()
  if (
    m.includes("gpt") ||
    m.includes("o1") ||
    m.includes("o3") ||
    m.includes("o4")
  )
    return Zap
  if (m.includes("claude")) return BrainCircuit
  if (m.includes("gemini")) return Sparkles
  if (m.includes("llama") || m.includes("mistral") || m.includes("groq"))
    return Flame
  if (m.includes("embed")) return Layers
  return Bot
}

function roleIcon(role: string): LucideIcon {
  const r = role.toLowerCase()
  if (r.includes("public") || r.includes("visitor")) return Globe
  if (r.includes("generat") || r.includes("content")) return Wand2
  if (r.includes("assistant") || r.includes("chat") || r.includes("copilot"))
    return MessageSquare
  if (r.includes("search") || r.includes("retriev")) return FileSearch
  if (r.includes("edit") || r.includes("refine")) return Pencil
  return Bot
}

function IconCountGrid({
  rows,
}: {
  rows: {
    key: string
    label: string
    count: number
    icon: LucideIcon
    mono?: boolean
    capitalize?: boolean
  }[]
}) {
  return (
    <div className="divide-border divide-y">
      {rows.map((row) => {
        const Icon = row.icon
        return (
          <div
            className="hover:bg-muted/30 flex items-center gap-3 px-1 py-2.5 transition-colors"
            key={row.key}
          >
            <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
              <Icon aria-hidden className="size-3.5" />
            </span>
            <span
              className={[
                "flex-1 truncate text-sm",
                row.mono ? "font-mono text-xs" : "",
                row.capitalize ? "capitalize" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.label}
            </span>
            <span className="text-muted-foreground tabular-nums text-sm">
              {row.count.toLocaleString("en-US")}
            </span>
          </div>
        )
      })}
    </div>
  )
}
