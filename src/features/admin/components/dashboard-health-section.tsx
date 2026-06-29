import "server-only"

import {
  ChevronRight,
  CircleCheck,
  CircleX,
  MonitorCheck,
  SearchCheck,
  Server,
} from "lucide-react"
import Link from "next/link"

import { AuditBandCard } from "@/features/admin/components/audit-band-card"
import {
  AiPortfolioAnalysis,
  DerivedInsightsPanel,
} from "@/features/admin/components/dashboard-insights"
import { SystemStatusCard } from "@/features/admin/components/system-status-card"
import {
  computeTopFailingRules,
  deriveInsights,
} from "@/features/admin/lib/derive-insights"
import { runAeoAudit } from "@/features/aeo/lib/audit/engine"
import { runDeploymentChecks } from "@/features/deployment/lib/checks"
import { runGeoAudit } from "@/features/geo/lib/audit/engine"
import { runSeoAudit } from "@/features/seo/lib/audit/engine"
import { getPostHogConfig } from "@/shared/lib/debug/posthog-validation"

// ─── Debug link card ──────────────────────────────────────────────────────────

function DebugLinkCard({
  title,
  description,
  href,
  status,
}: {
  title: string
  description: string
  href: string
  status?: { label: string; ok: boolean }
}) {
  return (
    <Link
      className="bg-card/40 border-border/60 group flex flex-col gap-2.5 rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/70"
      href={href}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <ChevronRight className="text-muted-foreground/40 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
      {status ? (
        <div className="flex items-center gap-1.5">
          {status.ok ? (
            <CircleCheck className="size-3.5 text-emerald-500" />
          ) : (
            <CircleX className="size-3.5 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${status.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {status.label}
          </span>
        </div>
      ) : null}
      <p className="text-muted-foreground text-xs">{description}</p>
    </Link>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

type PortfolioStats = {
  projects: {
    total: number
    published: number
    draft: number
    archived: number
  }
  content: {
    total: number
    byStatus: { published: number; draft: number; archived: number }
  }
  skills: number
  contentPublishedRate: number
}

export async function DashboardHealthSection({
  stats,
}: {
  stats?: PortfolioStats
}) {
  const auditedAt = new Date().toISOString()
  const [seo, aeo, geo, system] = await Promise.all([
    runSeoAudit(),
    runAeoAudit(),
    runGeoAudit(),
    runDeploymentChecks(),
  ])

  const { apiKey, projectId } = getPostHogConfig()
  const posthogConfigured = Boolean(apiKey && projectId)

  const insights = deriveInsights(seo, aeo, geo, stats)
  const auditSummary = {
    seo: {
      avgScore: seo.avgScore,
      criticalCount: seo.criticalCount,
      warningCount: seo.warningCount,
      totalCount: seo.totalCount,
      topFailingRules: computeTopFailingRules(seo.items),
    },
    aeo: {
      avgScore: aeo.avgScore,
      missingCount: aeo.missingCount,
      partialCount: aeo.partialCount,
      totalCount: aeo.totalCount,
      topFailingRules: computeTopFailingRules(aeo.items),
    },
    geo: {
      avgScore: geo.avgScore,
      absentCount: geo.absentCount,
      emergingCount: geo.emergingCount,
      totalCount: geo.totalCount,
      topFailingRules: computeTopFailingRules(geo.items),
    },
  }

  return (
    <div className="space-y-5">
      {/* Visibility */}
      <div className="space-y-3">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
          <SearchCheck className="size-3.5" />
          Visibility
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <AuditBandCard
            avgScore={seo.avgScore}
            bands={[
              {
                label: "Healthy",
                count: seo.healthyCount,
                variant: "good",
                items: seo.items
                  .filter((i) => i.band === "healthy")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
              {
                label: "Warning",
                count: seo.warningCount,
                variant: "warn",
                items: seo.items
                  .filter((i) => i.band === "warning")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
              {
                label: "Critical",
                count: seo.criticalCount,
                variant: "bad",
                items: seo.items
                  .filter((i) => i.band === "critical")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
            ]}
            auditedAt={auditedAt}
            greenThreshold={80}
            href="/admin/seo"
            title="SEO"
            yellowThreshold={50}
          />
          <AuditBandCard
            avgScore={aeo.avgScore}
            bands={[
              {
                label: "Optimized",
                count: aeo.optimizedCount,
                variant: "good",
                items: aeo.items
                  .filter((i) => i.band === "optimized")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
              {
                label: "Partial",
                count: aeo.partialCount,
                variant: "warn",
                items: aeo.items
                  .filter((i) => i.band === "partial")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
              {
                label: "Missing",
                count: aeo.missingCount,
                variant: "bad",
                items: aeo.items
                  .filter((i) => i.band === "missing")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
            ]}
            auditedAt={auditedAt}
            greenThreshold={75}
            href="/admin/aeo"
            title="AEO"
            yellowThreshold={40}
          />
          <AuditBandCard
            avgScore={geo.avgScore}
            bands={[
              {
                label: "Prominent",
                count: geo.prominentCount,
                variant: "good",
                items: geo.items
                  .filter((i) => i.band === "prominent")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
              {
                label: "Emerging",
                count: geo.emergingCount,
                variant: "warn",
                items: geo.items
                  .filter((i) => i.band === "emerging")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
              {
                label: "Absent",
                count: geo.absentCount,
                variant: "bad",
                items: geo.items
                  .filter((i) => i.band === "absent")
                  .map((i) => ({
                    id: i.id,
                    title: i.title,
                    score: i.score,
                    type: i.type,
                    publicPath: i.publicPath,
                  })),
              },
            ]}
            auditedAt={auditedAt}
            greenThreshold={70}
            href="/admin/geo"
            title="GEO"
            yellowThreshold={35}
          />
        </div>

        {/* Derived insights + AI analysis */}
        <div className="grid gap-3 md:grid-cols-2 md:items-stretch">
          <DerivedInsightsPanel insights={insights} />
          <AiPortfolioAnalysis auditSummary={auditSummary} />
        </div>
      </div>

      {/* System status */}
      <div className="space-y-3">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
          <Server className="size-3.5" />
          System
        </p>
        <SystemStatusCard
          overallScore={system.overallScore}
          readyToDeploy={system.readyToDeploy}
          sections={system.sections.map((s) => ({
            title: s.title,
            status: s.status,
            checks: s.checks,
          }))}
        />
      </div>

      {/* Debug tools */}
      <div className="space-y-3">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
          <MonitorCheck className="size-3.5" />
          Debug
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DebugLinkCard
            description="Verify every tracked event has reached PostHog in the last 30 days."
            href="/admin/debug/analytics"
            status={{
              label: posthogConfigured ? "Configured" : "Not configured",
              ok: posthogConfigured,
            }}
            title="PostHog Analytics"
          />
          <DebugLinkCard
            description="Fire simulated errors across public page, route handler, and server actions to verify Sentry capture."
            href="/admin/debug/sentry"
            title="Sentry Monitoring"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function DashboardHealthSectionSkeleton() {
  return (
    <div className="space-y-5">
      {/* Visibility skeleton */}
      <div className="space-y-2">
        <div className="bg-muted/50 h-3.5 w-24 animate-pulse rounded" />
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              className="bg-card/40 border-border/60 overflow-hidden rounded-xl border shadow-sm"
              key={i}
            >
              <div className="border-border/60 border-b px-4 py-3">
                <div className="bg-muted/60 h-4 w-16 animate-pulse rounded" />
              </div>
              <div className="flex items-center gap-5 p-5">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="bg-muted/50 h-8 w-full animate-pulse rounded-lg" />
                  <div className="bg-muted/50 h-8 w-full animate-pulse rounded-lg" />
                  <div className="bg-muted/50 h-8 w-full animate-pulse rounded-lg" />
                </div>
                <div className="size-[108px] shrink-0 animate-pulse rounded-full bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System skeleton */}
      <div className="space-y-2">
        <div className="bg-muted/50 h-3.5 w-20 animate-pulse rounded" />
        <div className="bg-card/40 border-border/60 overflow-hidden rounded-xl border shadow-sm">
          <div className="border-border/60 border-b px-4 py-3">
            <div className="bg-muted/60 h-4 w-28 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-border/40">
            <div className="flex flex-col gap-4 p-4">
              <div className="bg-muted/60 h-9 w-20 animate-pulse rounded" />
              <div className="bg-muted/40 h-2.5 w-full animate-pulse rounded-full" />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="bg-muted/50 h-5 w-10 animate-pulse rounded" />
                  <div className="bg-muted/50 h-5 w-10 animate-pulse rounded" />
                </div>
                <div className="bg-muted/40 h-5 w-24 animate-pulse rounded" />
              </div>
            </div>
            <div className="flex flex-col justify-center divide-y divide-border/30 py-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  key={i}
                >
                  <div className="bg-muted/50 h-3 w-24 animate-pulse rounded" />
                  <div className="bg-muted/50 h-3 w-10 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Debug skeleton */}
      <div className="space-y-2">
        <div className="bg-muted/50 h-3.5 w-16 animate-pulse rounded" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              className="bg-card/40 border-border/60 space-y-2 rounded-xl border p-4 shadow-sm"
              key={i}
            >
              <div className="bg-muted/60 h-4 w-28 animate-pulse rounded" />
              <div className="bg-muted/50 h-3 w-20 animate-pulse rounded" />
              <div className="bg-muted/40 h-3 w-40 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
