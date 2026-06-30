import {
  ExternalLink,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import {
  AdminCallout,
  AdminPanel,
} from "@/features/admin/components/admin-panel"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  getPostHogConfig,
  getPostHogInsights,
  type PostHogInsights,
} from "@/shared/lib/debug/posthog-validation"
import { PostHogIcon } from "@/shared/ui/brand-icons"

import { EventCoverageTable } from "./event-coverage-table"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "PostHog Analytics",
  robots: { index: false, follow: false },
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function pct(a: number, b: number) {
  if (b === 0) return 0
  return Math.round((a / b) * 100)
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <div className="bg-muted/40 rounded-xl border border-border/60 px-5 py-4">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {sub && (
        <p
          className={`mt-1.5 flex items-center gap-1 text-xs ${
            trend === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : trend === "down"
                ? "text-red-500"
                : "text-muted-foreground"
          }`}
        >
          {trend === "up" && <TrendingUp className="size-3 shrink-0" />}
          {trend === "down" && <TrendingDown className="size-3 shrink-0" />}
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── Bar chart row ────────────────────────────────────────────────────────────

function BarRow({
  rank,
  label,
  count,
  max,
  color,
}: {
  rank: number
  label: string
  count: number
  max: number
  color: string
}) {
  const w = pct(count, max)
  return (
    <div className="flex items-center gap-4 py-2.5">
      <span className="text-muted-foreground w-5 shrink-0 text-right text-xs tabular-nums font-medium">
        {rank}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate font-mono text-sm">{label || "/"}</span>
          <span className="text-muted-foreground shrink-0 text-sm tabular-nums font-medium">
            {fmt(count)}
          </span>
        </div>
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${w}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Audience donut ───────────────────────────────────────────────────────────

function AudienceDonut({ newPct }: { newPct: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const newDash = (newPct / 100) * circ
  const retDash = circ - newDash

  return (
    <svg className="size-52" viewBox="0 0 100 100">
      <circle
        className="fill-none stroke-violet-500"
        cx="50"
        cy="50"
        r={r}
        strokeDasharray={`${retDash} ${newDash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        strokeWidth="10"
      />
      <circle
        className="fill-none stroke-blue-500"
        cx="50"
        cy="50"
        r={r}
        strokeDasharray={`${newDash} ${retDash}`}
        strokeDashoffset={circ * 0.25 + retDash}
        strokeLinecap="round"
        strokeWidth="10"
      />
      <text
        className="fill-foreground font-bold"
        dominantBaseline="middle"
        fontSize="14"
        fontWeight="700"
        textAnchor="middle"
        x="50"
        y="47"
      >
        {newPct}%
      </text>
      <text
        className="fill-muted-foreground"
        dominantBaseline="middle"
        fontSize="7"
        textAnchor="middle"
        x="50"
        y="60"
      >
        new
      </text>
    </svg>
  )
}

// ─── AI insights ──────────────────────────────────────────────────────────────

function AISuggestions({ insights }: { insights: PostHogInsights }) {
  const suggestions: {
    title: string
    body: string
    type: "warn" | "info" | "good"
  }[] = []
  const coveragePct = pct(
    insights.eventCoverage.passed,
    insights.eventCoverage.total
  )

  if (coveragePct < 50) {
    suggestions.push({
      title: "Low event coverage — most events haven't fired yet",
      body: `Only ${coveragePct}% of your tracked events have data. Deploy to production and drive real traffic to validate instrumentation. Until then, only pageviews and basic navigation will show up.`,
      type: "warn",
    })
  } else if (coveragePct < 100) {
    suggestions.push({
      title: `${insights.eventCoverage.noData} event${insights.eventCoverage.noData !== 1 ? "s" : ""} still silent`,
      body: `${100 - coveragePct}% of tracked events have no data yet. These could be features not yet discovered by visitors, or instrumentation not triggered in this time window.`,
      type: "info",
    })
  } else {
    suggestions.push({
      title: "All events are live",
      body: "Every tracked event is receiving data. Your instrumentation is working correctly across all features — great signal quality for analysis.",
      type: "good",
    })
  }

  if (insights.uniqueVisitors30d === 0) {
    suggestions.push({
      title: "No visitors recorded yet",
      body: "PostHog is connected but has captured zero visitors in 30 days. Check that NEXT_PUBLIC_POSTHOG_KEY is set in your production environment and that the SDK is initialising on the client side.",
      type: "warn",
    })
  } else if (insights.sessions30d > 0) {
    const ppSess = (insights.pageviews30d / insights.sessions30d).toFixed(1)
    const ppNum = Number(ppSess)
    suggestions.push({
      title: `${ppSess} pages per session — ${ppNum < 2 ? "low engagement depth" : ppNum >= 4 ? "strong engagement" : "solid engagement"}`,
      body:
        ppNum < 2
          ? `Visitors are leaving after just ${ppSess} pages on average. Add related content links, improve internal navigation, and surface your best projects prominently to encourage deeper exploration.`
          : ppNum >= 4
            ? `Visitors explore ${ppSess} pages per session — excellent depth. Keep publishing fresh content and ensure your navigation surfaces your best work.`
            : `${ppSess} pages per session is reasonable. Aim for 3+ by adding "related projects", "you might also like" sections, and prominent CTAs on each page.`,
      type: ppNum < 2 ? "warn" : "info",
    })
  }

  const total7 = insights.newUsers7d + insights.returningUsers7d
  if (total7 > 0) {
    const newPct = pct(insights.newUsers7d, total7)
    suggestions.push({
      title: `${newPct}% new visitors this week`,
      body:
        newPct > 80
          ? "Your audience is mostly new — great discoverability. Consider adding newsletter sign-up, GitHub follow, or LinkedIn link to convert visitors into followers who come back."
          : newPct < 30
            ? "Strong returning visitor rate — your content keeps people coming back. Invest in SEO, social sharing, and new content to grow the top-of-funnel."
            : "Healthy balance of new and returning visitors. Keep producing fresh content for returning users while optimising SEO for discoverability.",
      type: "info",
    })
  }

  if (insights.topEvents.length === 0) {
    suggestions.push({
      title: "No custom interactions captured yet",
      body: "Pageviews are being collected but no feature-level events (clicks, searches, AI usage) have been tracked yet. This is completely normal before launch — come back after real traffic.",
      type: "info",
    })
  } else {
    const top = insights.topEvents[0]
    if (top) {
      suggestions.push({
        title: `"${top.event}" is your most-used feature`,
        body: `This event fired ${fmt(top.count)} times — more than any other interaction. This feature is clearly valuable. Ensure its flow is optimised, consider A/B testing variations, and prioritise related features.`,
        type: "good",
      })
    }
  }

  const typeStyles = {
    warn: { border: "border-amber-500/20 bg-amber-500/5", dot: "bg-amber-500" },
    info: { border: "border-border/60 bg-muted/30", dot: "bg-blue-500" },
    good: {
      border: "border-emerald-500/20 bg-emerald-500/5",
      dot: "bg-emerald-500",
    },
  }

  return (
    <AdminPanel
      className="h-full"
      title="AI Insights"
      actions={<Sparkles className="size-4 text-muted-foreground" />}
    >
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const st = typeStyles[s.type]
          return (
            <div className={`rounded-xl border px-4 py-4 ${st.border}`} key={i}>
              <div className="flex items-start gap-3">
                <span
                  className={`mt-2 size-2 shrink-0 rounded-full ${st.dot}`}
                />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold leading-snug">
                    {s.title}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminPanel>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function PostHogPage() {
  const { projectId, apiKey } = getPostHogConfig()

  const openAction = (
    <a
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      href={`https://us.posthog.com/project/${projectId ?? ""}/dashboard`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ExternalLink aria-hidden className="size-3.5" />
      Open PostHog
    </a>
  )

  if (!apiKey || !projectId) {
    return (
      <div className="space-y-6">
        <PageHeader
          actions={openAction}
          description="Live analytics, event coverage, and AI insights from PostHog."
          icon={<PostHogIcon className="size-7" />}
          title="PostHog"
        />
        <AdminCallout title="PostHog not configured" variant="error">
          <p>
            Add <code>POSTHOG_API_KEY</code> (personal API key) and{" "}
            <code>POSTHOG_PROJECT_ID</code> to your environment variables.
          </p>
        </AdminCallout>
      </div>
    )
  }

  const insights = await getPostHogInsights(projectId, apiKey)
  const coveragePct = pct(
    insights.eventCoverage.passed,
    insights.eventCoverage.total
  )
  const total7 = insights.newUsers7d + insights.returningUsers7d
  const newPct = pct(insights.newUsers7d, total7)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={openAction}
        description="Live analytics, event coverage, and AI insights from PostHog."
        icon={<PostHogIcon className="size-7" />}
        title="PostHog"
      />

      {/* ── Traffic overview ─────────────────────────────────────────── */}
      <AdminPanel
        actions={
          <span className="text-muted-foreground text-xs">
            Project {projectId} ·{" "}
            {new Date(insights.capturedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        }
        title="Traffic overview"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Pageviews (30d)"
            sub={`${fmt(insights.pageviews7d)} in last 7 days`}
            value={fmt(insights.pageviews30d)}
          />
          <StatTile
            label="Unique visitors (30d)"
            sub={`${fmt(insights.uniqueVisitors7d)} in last 7 days`}
            value={fmt(insights.uniqueVisitors30d)}
          />
          <StatTile
            label="Sessions (30d)"
            sub={
              insights.sessions30d > 0
                ? `${(insights.pageviews30d / insights.sessions30d).toFixed(1)} pages / session`
                : "No sessions yet"
            }
            value={fmt(insights.sessions30d)}
          />
          <StatTile
            label="Event coverage"
            sub={`${insights.eventCoverage.passed} of ${insights.eventCoverage.total} events live`}
            trend={
              coveragePct === 100
                ? "up"
                : coveragePct >= 50
                  ? "neutral"
                  : "down"
            }
            value={`${coveragePct}%`}
          />
        </div>
      </AdminPanel>

      {/* ── Top pages + Top interactions ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel
          description="Most visited URLs in the last 30 days."
          title="Top pages"
        >
          {insights.topPages.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
              No pageview data yet
            </div>
          ) : (
            <div className="divide-border/60 divide-y">
              {insights.topPages.map((page, i) => (
                <BarRow
                  color="bg-blue-500/70"
                  count={page.count}
                  key={page.path}
                  label={page.path}
                  max={insights.topPages[0]?.count ?? 1}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          description="Most-fired custom interaction events in the last 30 days."
          title="Top interactions"
        >
          {insights.topEvents.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-center text-sm">
              No custom events yet —<br />
              expected before launch
            </div>
          ) : (
            <div className="divide-border/60 divide-y">
              {insights.topEvents.map((ev, i) => (
                <BarRow
                  color="bg-violet-500/70"
                  count={ev.count}
                  key={ev.event}
                  label={ev.event}
                  max={insights.topEvents[0]?.count ?? 1}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
        </AdminPanel>
      </div>

      {/* ── AI Insights (70%) + Audience (30%) ──────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AISuggestions insights={insights} />

        {/* Audience donut */}
        <AdminPanel
          className="flex h-full flex-col"
          description="New vs. returning visitors in the last 7 days."
          title="Audience"
        >
          <div className="flex flex-1 flex-col items-center justify-between gap-5 py-2">
            {/* Donut */}
            <AudienceDonut newPct={total7 === 0 ? 50 : newPct} />

            {/* Stats */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-blue-500/8 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-sm text-muted-foreground">New</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {fmt(insights.newUsers7d)}
                  </span>
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    {total7 > 0 ? `${newPct}%` : "—"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-violet-500/8 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-violet-500 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Returning
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {fmt(insights.returningUsers7d)}
                  </span>
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    {total7 > 0 ? `${100 - newPct}%` : "—"}
                  </span>
                </div>
              </div>
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-3.5 shrink-0" />
                    Total
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {fmt(total7)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>

      {/* ── Event coverage ───────────────────────────────────────────── */}
      <AdminPanel
        actions={
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-semibold ${
                coveragePct === 100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : coveragePct >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-500"
              }`}
            >
              {coveragePct}% live
            </span>
            <div className="bg-muted h-2 w-20 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all ${
                  coveragePct === 100
                    ? "bg-emerald-500"
                    : coveragePct >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${coveragePct}%` }}
              />
            </div>
          </div>
        }
        description="All tracked custom events with their category, event count, and last-seen timestamp. Events with NO DATA haven't fired in the last 30 days — normal before launch."
        title="Event coverage"
      >
        <EventCoverageTable results={insights.eventResults} />
      </AdminPanel>
    </div>
  )
}
