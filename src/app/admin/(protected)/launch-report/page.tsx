import "server-only"

import {
  Activity,
  ArrowRight,
  Brain,
  FileText,
  Gauge,
  type LucideIcon,
  Radar,
  Rocket,
  Search,
  Server,
  Shield,
} from "lucide-react"
import Link from "next/link"

import {
  AdminCallout,
  AdminPanel,
  PageHeader,
  StatCard,
} from "@/features/admin/components"
import {
  type LaunchFindingLevel,
  LaunchFindingRow,
  LaunchScoreBar,
  launchScoreColor,
  RecommendationBanner,
} from "@/features/admin/components/launch-status"
import { getAiUsageSummary } from "@/features/admin/lib/ai-usage-queries"
import { runContentHealthAudit } from "@/features/admin/lib/content-health/engine"
import { runDeploymentChecks } from "@/features/deployment/lib/checks"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { isDistributedRateLimitConfigured } from "@/shared/lib/security/rate-limit"
import { createAdminClient } from "@/shared/lib/supabase/admin"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Launch Report",
  robots: { index: false, follow: false },
}

type Finding = {
  level: LaunchFindingLevel
  message: string
}

type ScoreDimension = {
  id: string
  label: string
  icon: LucideIcon
  score: number
  weight: number
  findings: Finding[]
}

const VALIDATION_TOOLS = [
  { href: "/admin/launch", label: "Deployment checks", icon: Rocket },
  { href: "/admin/content-health", label: "Content health", icon: FileText },
  { href: "/admin/debug/sentry", label: "Sentry validation", icon: Radar },
  {
    href: "/admin/debug/analytics",
    label: "Analytics validation",
    icon: Activity,
  },
  { href: "/admin/ai", label: "AI usage & costs", icon: Brain },
] as const

function finding(level: LaunchFindingLevel, message: string): Finding {
  return { level, message }
}

async function computeSecurityScore(): Promise<ScoreDimension> {
  const findings: Finding[] = []
  let score = 100

  const required = [
    "SUPABASE_SECRET_KEY",
    "ADMIN_EMAIL",
    "SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]

  for (const key of required) {
    if (process.env[key]) {
      findings.push(finding("ok", `${key} set`))
    } else {
      findings.push(finding("error", `${key} missing`))
      score -= 20
    }
  }

  if (isDistributedRateLimitConfigured()) {
    findings.push(finding("ok", "Upstash Redis configured for rate limiting"))
  } else if (process.env.NODE_ENV === "production") {
    findings.push(
      finding("error", "Production rate limiting disabled — Upstash required")
    )
    score -= 15
  } else {
    findings.push(
      finding("warn", "Upstash not set — in-memory fallback in development")
    )
    score -= 5
  }

  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    findings.push(finding("ok", "Sentry DSN configured"))
  } else {
    findings.push(
      finding("warn", "Sentry DSN not set — recommended for production")
    )
    score -= 5
  }

  return {
    id: "security",
    label: "Security",
    icon: Shield,
    score: Math.max(0, score),
    weight: 20,
    findings,
  }
}

async function computeAiScore(): Promise<ScoreDimension> {
  const findings: Finding[] = []
  let score = 60

  const aiKeys = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
  ]
  const configuredProviders = aiKeys.filter((key) => process.env[key])

  if (configuredProviders.length >= 2) {
    score += 20
    findings.push(
      finding(
        "ok",
        `${configuredProviders.length} AI providers configured — failover capable`
      )
    )
  } else if (configuredProviders.length === 1) {
    score += 10
    findings.push(finding("warn", "Only one AI provider — no failover"))
  } else {
    findings.push(finding("error", "No AI providers configured"))
  }

  try {
    const summary = await getAiUsageSummary(7)
    if (summary.totalRequests > 0) {
      score += 20
      findings.push(
        finding(
          "ok",
          `${summary.totalRequests} AI requests logged (last 7 days)`
        )
      )
      findings.push(
        finding("ok", `${summary.successRate.toFixed(1)}% success rate`)
      )
    } else {
      findings.push(finding("warn", "No AI usage logged yet"))
    }
  } catch {
    findings.push(finding("warn", "Could not read AI usage logs"))
  }

  return {
    id: "ai",
    label: "AI systems",
    icon: Brain,
    score: Math.min(100, Math.max(0, score)),
    weight: 15,
    findings,
  }
}

async function computeContentScore(): Promise<ScoreDimension> {
  try {
    const audit = await runContentHealthAudit()
    const findings: Finding[] = [
      finding("ok", `${audit.totalItems} total content items`),
      finding("ok", `${audit.healthyCount} healthy (≥80%)`),
    ]

    if (audit.warningCount > 0) {
      findings.push(
        finding("warn", `${audit.warningCount} items need improvement (50–79%)`)
      )
    }
    if (audit.criticalCount > 0) {
      findings.push(
        finding("error", `${audit.criticalCount} critical items (<50%)`)
      )
    }

    return {
      id: "content",
      label: "Content",
      icon: FileText,
      score: audit.overallScore,
      weight: 20,
      findings,
    }
  } catch {
    return {
      id: "content",
      label: "Content",
      icon: FileText,
      score: 0,
      weight: 20,
      findings: [finding("error", "Could not run content health audit")],
    }
  }
}

async function computeSeoScore(): Promise<ScoreDimension> {
  const findings: Finding[] = []
  let score = 60

  if (process.env.SITE_URL) {
    score += 20
    findings.push(finding("ok", "SITE_URL configured — canonical URLs active"))
  } else {
    findings.push(finding("error", "SITE_URL missing — canonical URLs broken"))
  }

  try {
    const settings = await getPublicSettings()
    const envUrl = process.env.SITE_URL?.trim().replace(/\/$/, "")
    const cmsUrl = settings.site.site_url?.trim().replace(/\/$/, "")

    if (envUrl && cmsUrl && envUrl !== cmsUrl) {
      findings.push(
        finding("error", `SEO mismatch — SITE_URL=${envUrl}, CMS=${cmsUrl}`)
      )
      score -= 30
    } else if (envUrl && cmsUrl) {
      findings.push(finding("ok", "SITE_URL matches CMS site_url"))
      score += 10
    } else if (envUrl && !cmsUrl) {
      findings.push(
        finding("warn", "CMS site_url not set — using SITE_URL env fallback")
      )
    }
  } catch {
    findings.push(finding("warn", "Could not verify SITE_URL vs CMS site_url"))
  }

  try {
    const fs = await import("fs/promises")
    const hasSitemap = await fs
      .access("src/app/sitemap.ts")
      .then(() => true)
      .catch(() => false)
    const hasRobots = await fs
      .access("src/app/robots.ts")
      .then(() => true)
      .catch(() => false)
    const hasLlms = await fs
      .access("src/app/llms.txt/route.ts")
      .then(() => true)
      .catch(() => false)

    if (hasSitemap) findings.push(finding("ok", "sitemap.ts present"))
    else findings.push(finding("warn", "sitemap.ts missing"))

    if (hasRobots) findings.push(finding("ok", "robots.ts present"))
    else findings.push(finding("warn", "robots.ts missing"))

    if (hasLlms) {
      findings.push(finding("ok", "llms.txt served dynamically from SITE_URL"))
    } else {
      findings.push(finding("warn", "llms.txt route missing"))
    }
  } catch {
    findings.push(finding("info", "Could not verify SEO route files"))
  }

  return {
    id: "seo",
    label: "SEO",
    icon: Search,
    score: Math.min(100, Math.max(0, score)),
    weight: 10,
    findings,
  }
}

async function computeInfraScore(): Promise<ScoreDimension> {
  const findings: Finding[] = []
  let score = 40

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from("projects").select("id").limit(1)
    if (!error) {
      score += 40
      findings.push(finding("ok", "Supabase connected"))
    } else {
      findings.push(finding("error", `Supabase error: ${error.message}`))
    }
  } catch {
    findings.push(finding("error", "Supabase connection failed"))
  }

  if (isDistributedRateLimitConfigured()) {
    score += 10
    findings.push(finding("ok", "Redis configured — rate limiting active"))
  } else if (process.env.NODE_ENV === "production") {
    findings.push(
      finding("error", "Production rate limiting disabled — Upstash required")
    )
  } else {
    findings.push(
      finding("warn", "Redis not configured — in-memory fallback in dev")
    )
  }

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    score += 10
    findings.push(finding("ok", "PostHog analytics configured"))
  } else {
    findings.push(finding("warn", "PostHog not configured"))
  }

  return {
    id: "infra",
    label: "Infrastructure",
    icon: Server,
    score: Math.min(100, score),
    weight: 15,
    findings,
  }
}

async function computeMonitoringScore(): Promise<ScoreDimension> {
  const findings: Finding[] = []
  let score = 40

  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    score += 40
    findings.push(finding("ok", "Sentry configured"))
  } else {
    findings.push(
      finding("warn", "Sentry DSN not set — errors will not be captured")
    )
  }

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    score += 20
    findings.push(finding("ok", "PostHog analytics configured"))
  } else {
    findings.push(finding("warn", "PostHog not configured"))
  }

  return {
    id: "monitoring",
    label: "Monitoring",
    icon: Radar,
    score: Math.min(100, score),
    weight: 10,
    findings,
  }
}

async function computeKnowledgeScore(): Promise<ScoreDimension> {
  const findings: Finding[] = []
  let score = 50

  try {
    const supabase = await createAdminClient()
    const [expertiseRes, techRes, conceptRes] = await Promise.all([
      supabase.from("expertise_areas").select("id", { count: "exact" }),
      supabase.from("technologies").select("id", { count: "exact" }),
      supabase.from("concept_registry").select("id", { count: "exact" }),
    ])

    const expertiseCount = expertiseRes.count ?? 0
    const techCount = techRes.count ?? 0
    const conceptCount = conceptRes.count ?? 0

    if (expertiseCount >= 3) {
      score += 20
      findings.push(finding("ok", `${expertiseCount} expertise areas`))
    } else {
      findings.push(
        finding("warn", `Only ${expertiseCount} expertise areas — need ≥3`)
      )
    }

    if (techCount >= 5) {
      score += 15
      findings.push(finding("ok", `${techCount} technologies`))
    } else {
      findings.push(finding("warn", `Only ${techCount} technologies — need ≥5`))
    }

    if (conceptCount >= 3) {
      score += 15
      findings.push(finding("ok", `${conceptCount} concepts`))
    } else {
      findings.push(finding("warn", `Only ${conceptCount} concepts — need ≥3`))
    }
  } catch {
    findings.push(finding("warn", "Could not query knowledge graph entities"))
  }

  return {
    id: "knowledge",
    label: "Knowledge graph",
    icon: Gauge,
    score: Math.min(100, score),
    weight: 10,
    findings,
  }
}

function DimensionCard({ dimension }: { dimension: ScoreDimension }) {
  const Icon = dimension.icon
  const issues = dimension.findings.filter((item) => item.level !== "ok")
  const passes = dimension.findings.filter((item) => item.level === "ok")

  return (
    <article className="border-border bg-background/60 space-y-4 rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="border-border bg-muted/50 flex size-9 shrink-0 items-center justify-center rounded-lg border">
            <Icon aria-hidden className="text-muted-foreground size-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-sm font-medium">{dimension.label}</h3>
            <p className="text-muted-foreground text-xs">
              Weight {dimension.weight}%
            </p>
          </div>
        </div>
        <p
          className={cn(
            "shrink-0 text-lg font-semibold tabular-nums",
            launchScoreColor(dimension.score)
          )}
        >
          {dimension.score}
        </p>
      </div>

      <LaunchScoreBar score={dimension.score} />

      {issues.length > 0 ? (
        <ul className="space-y-1.5">
          {issues.map((item) => (
            <LaunchFindingRow
              key={`${item.level}-${item.message}`}
              level={item.level}
              message={item.message}
            />
          ))}
        </ul>
      ) : null}

      {passes.length > 0 ? (
        <ul className="space-y-1">
          {passes.slice(0, 3).map((item) => (
            <LaunchFindingRow
              key={`${item.level}-${item.message}`}
              level={item.level}
              message={item.message}
            />
          ))}
          {passes.length > 3 ? (
            <li className="text-muted-foreground pl-5 text-xs">
              +{passes.length - 3} more checks passed
            </li>
          ) : null}
        </ul>
      ) : null}
    </article>
  )
}

export default async function LaunchReportPage() {
  const [security, ai, content, seo, infra, monitoring, knowledge, deployment] =
    await Promise.all([
      computeSecurityScore(),
      computeAiScore(),
      computeContentScore(),
      computeSeoScore(),
      computeInfraScore(),
      computeMonitoringScore(),
      computeKnowledgeScore(),
      runDeploymentChecks(),
    ])

  const dimensions: ScoreDimension[] = [
    security,
    ai,
    content,
    seo,
    infra,
    monitoring,
    knowledge,
  ]

  const totalWeight = dimensions.reduce(
    (sum, dimension) => sum + dimension.weight,
    0
  )
  const launchScore = Math.round(
    dimensions.reduce(
      (sum, dimension) =>
        sum + dimension.score * (dimension.weight / totalWeight),
      0
    )
  )

  const allFindings = dimensions.flatMap((dimension) => dimension.findings)
  const criticalIssues = allFindings.filter((item) => item.level === "error")
  const warnings = allFindings.filter((item) => item.level === "warn")

  let recommendation: "ready" | "caution" | "blocked"
  if (!deployment.readyToDeploy || criticalIssues.length > 0) {
    recommendation = "blocked"
  } else if (warnings.length > 0 || launchScore < 80) {
    recommendation = "caution"
  } else {
    recommendation = "ready"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Weighted readiness across security, content, AI, SEO, and infrastructure."
        title="Launch Report"
      />

      <RecommendationBanner
        launchScore={launchScore}
        recommendation={recommendation}
      />

      <AdminPanel title="At a glance">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Launch score" value={`${launchScore}/100`} />
          <StatCard label="Critical issues" value={criticalIssues.length} />
          <StatCard label="Warnings" value={warnings.length} />
          <StatCard
            label="Deployment gate"
            value={deployment.readyToDeploy ? "Pass" : "Fail"}
          />
        </div>
      </AdminPanel>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Score breakdown</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {dimensions.map((dimension) => (
            <DimensionCard dimension={dimension} key={dimension.id} />
          ))}
        </div>
      </section>

      {criticalIssues.length > 0 ? (
        <AdminCallout title="Critical issues" variant="error">
          <ul className="space-y-1.5">
            {criticalIssues.map((item) => (
              <LaunchFindingRow
                key={item.message}
                level={item.level}
                message={item.message}
              />
            ))}
          </ul>
        </AdminCallout>
      ) : null}

      {warnings.length > 0 ? (
        <AdminCallout title="Warnings" variant="warning">
          <ul className="space-y-1.5">
            {warnings.map((item) => (
              <LaunchFindingRow
                key={item.message}
                level={item.level}
                message={item.message}
              />
            ))}
          </ul>
        </AdminCallout>
      ) : null}

      <AdminPanel
        description="Run targeted checks before and after deployment."
        title="Validation tools"
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {VALIDATION_TOOLS.map(({ href, label, icon: Icon }) => (
            <Link
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-between px-3 py-2.5 font-normal"
              )}
              href={href}
              key={href}
            >
              <span className="inline-flex items-center gap-2">
                <Icon aria-hidden className="size-4 shrink-0" />
                {label}
              </span>
              <ArrowRight
                aria-hidden
                className="size-3.5 shrink-0 opacity-50"
              />
            </Link>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Post-deployment checklist">
        <ul className="space-y-2">
          {[
            "Add Vercel env vars: SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_API_KEY, POSTHOG_PROJECT_ID, UPSTASH_REDIS_*",
            "Add GitHub secret SITE_URL for keep-alive workflow",
            "Run load test: npm run load-test https://preview.vercel.app",
            "Complete mobile audit checklist: docs/mobile-audit.md",
            "Verify Sentry events at /admin/debug/sentry",
            "Verify analytics at /admin/debug/analytics after traffic",
          ].map((item) => (
            <LaunchFindingRow key={item} level="info" message={item} />
          ))}
        </ul>
      </AdminPanel>
    </div>
  )
}
