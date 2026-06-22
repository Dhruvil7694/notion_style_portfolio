import { PageHeader, StatCard } from "@/components/admin"
import { getAiUsageSummary } from "@/lib/admin/ai-usage-queries"
import { runContentHealthAudit } from "@/lib/content-health/engine"
import { runDeploymentChecks } from "@/lib/deployment/checks"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Launch Report",
  robots: { index: false, follow: false },
}

type ScoreDimension = {
  label: string
  score: number
  weight: number
  details: string[]
  warnings: string[]
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10)
  return "█".repeat(filled) + "░".repeat(10 - filled)
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

async function computeSecurityScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []
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
      details.push(`✓ ${key} set`)
    } else {
      warnings.push(`✗ ${key} missing`)
      score -= 20
    }
  }

  const optional = ["SENTRY_DSN", "UPSTASH_REDIS_REST_URL"]
  for (const key of optional) {
    if (process.env[key]) {
      details.push(`✓ ${key} set`)
    } else {
      warnings.push(`⚠ ${key} not set (optional but recommended)`)
      score -= 5
    }
  }

  return {
    label: "Security",
    score: Math.max(0, score),
    weight: 20,
    details,
    warnings,
  }
}

async function computeAiScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []
  let score = 60

  const aiKeys = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
  ]
  const configuredProviders = aiKeys.filter((k) => process.env[k])

  if (configuredProviders.length >= 2) {
    score += 20
    details.push(
      `✓ ${configuredProviders.length} AI providers configured (failover capable)`
    )
  } else if (configuredProviders.length === 1) {
    score += 10
    warnings.push(`⚠ Only 1 AI provider — no failover`)
  } else {
    warnings.push(`✗ No AI providers configured`)
  }

  try {
    const summary = await getAiUsageSummary(7)
    if (summary.totalRequests > 0) {
      score += 20
      details.push(`✓ ${summary.totalRequests} AI requests logged (last 7d)`)
      details.push(`✓ ${summary.successRate.toFixed(1)}% success rate`)
    } else {
      details.push("⚠ No AI usage logged yet")
    }
  } catch {
    warnings.push("⚠ Could not read AI usage logs")
  }

  return {
    label: "AI Systems",
    score: Math.min(100, Math.max(0, score)),
    weight: 15,
    details,
    warnings,
  }
}

async function computeContentScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []

  try {
    const audit = await runContentHealthAudit()

    details.push(`✓ ${audit.totalItems} total content items`)
    details.push(`✓ ${audit.healthyCount} healthy (≥80%)`)

    if (audit.warningCount > 0) {
      warnings.push(`⚠ ${audit.warningCount} items need improvement (50–79%)`)
    }
    if (audit.criticalCount > 0) {
      warnings.push(`✗ ${audit.criticalCount} critical items (<50%)`)
    }

    return {
      label: "Content",
      score: audit.overallScore,
      weight: 20,
      details,
      warnings,
    }
  } catch {
    return {
      label: "Content",
      score: 0,
      weight: 20,
      details: [],
      warnings: ["✗ Could not run content health audit"],
    }
  }
}

async function computeSeoScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []
  let score = 60

  if (process.env.SITE_URL) {
    score += 20
    details.push("✓ SITE_URL configured (canonical URLs active)")
  } else {
    warnings.push("✗ SITE_URL missing — canonical URLs broken")
  }

  // Check sitemap/robots existence via file presence
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

    if (hasSitemap) {
      score += 10
      details.push("✓ sitemap.ts present")
    } else {
      warnings.push("⚠ sitemap.ts missing")
    }
    if (hasRobots) {
      score += 10
      details.push("✓ robots.ts present")
    } else {
      warnings.push("⚠ robots.ts missing")
    }
  } catch {
    details.push("ℹ Could not verify sitemap/robots files")
  }

  return {
    label: "SEO",
    score: Math.min(100, score),
    weight: 10,
    details,
    warnings,
  }
}

async function computeInfraScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []
  let score = 40

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from("projects").select("id").limit(1)
    if (!error) {
      score += 40
      details.push("✓ Supabase connected")
    } else {
      warnings.push(`✗ Supabase error: ${error.message}`)
    }
  } catch {
    warnings.push("✗ Supabase connection failed")
  }

  if (process.env.UPSTASH_REDIS_REST_URL) {
    score += 10
    details.push("✓ Redis configured (rate limiting active)")
  } else {
    warnings.push("⚠ Redis not configured — rate limiting disabled")
  }

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    score += 10
    details.push("✓ PostHog analytics configured")
  } else {
    warnings.push("⚠ PostHog not configured")
  }

  return {
    label: "Infrastructure",
    score: Math.min(100, score),
    weight: 15,
    details,
    warnings,
  }
}

async function computeMonitoringScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []
  let score = 40

  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    score += 40
    details.push("✓ Sentry configured")
  } else {
    warnings.push("⚠ Sentry DSN not set — errors won't be captured")
  }

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    score += 20
    details.push("✓ PostHog analytics configured")
  } else {
    warnings.push("⚠ PostHog not configured")
  }

  return {
    label: "Monitoring",
    score: Math.min(100, score),
    weight: 10,
    details,
    warnings,
  }
}

async function computeKnowledgeScore(): Promise<ScoreDimension> {
  const details: string[] = []
  const warnings: string[] = []
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
      details.push(`✓ ${expertiseCount} expertise areas`)
    } else {
      warnings.push(`⚠ Only ${expertiseCount} expertise areas (need ≥3)`)
    }

    if (techCount >= 5) {
      score += 15
      details.push(`✓ ${techCount} technologies`)
    } else {
      warnings.push(`⚠ Only ${techCount} technologies (need ≥5)`)
    }

    if (conceptCount >= 3) {
      score += 15
      details.push(`✓ ${conceptCount} concepts`)
    } else {
      warnings.push(`⚠ Only ${conceptCount} concepts (need ≥3)`)
    }
  } catch {
    warnings.push("⚠ Could not query knowledge graph entities")
  }

  return {
    label: "Knowledge Graph",
    score: Math.min(100, score),
    weight: 10,
    details,
    warnings,
  }
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

  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0)
  const launchScore = Math.round(
    dimensions.reduce((s, d) => s + d.score * (d.weight / totalWeight), 0)
  )

  const allWarnings = dimensions.flatMap((d) => d.warnings)
  const criticalWarnings = allWarnings.filter((w) => w.startsWith("✗"))
  const minorWarnings = allWarnings.filter((w) => w.startsWith("⚠"))

  let recommendation:
    | "READY FOR PRODUCTION"
    | "READY WITH MINOR WARNINGS"
    | "NOT READY"
  if (!deployment.readyToDeploy || criticalWarnings.length > 0) {
    recommendation = "NOT READY"
  } else if (minorWarnings.length > 0 || launchScore < 80) {
    recommendation = "READY WITH MINOR WARNINGS"
  } else {
    recommendation = "READY FOR PRODUCTION"
  }

  const recommendationStyle =
    recommendation === "READY FOR PRODUCTION"
      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      : recommendation === "READY WITH MINOR WARNINGS"
        ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
        : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"

  const recommendationIcon =
    recommendation === "READY FOR PRODUCTION"
      ? "✓"
      : recommendation === "READY WITH MINOR WARNINGS"
        ? "⚠"
        : "✗"

  return (
    <div className="space-y-8">
      <PageHeader
        description="Comprehensive launch readiness report across all systems."
        title="Launch Report"
      />

      {/* Final recommendation */}
      <section>
        <div
          className={`rounded-lg border-2 p-6 text-center ${recommendationStyle}`}
        >
          <p className="text-2xl font-bold tracking-wide">
            {recommendationIcon} {recommendation}
          </p>
          <p className="mt-1 text-sm opacity-80">
            Launch Score: {launchScore}/100
          </p>
        </div>
      </section>

      {/* Summary stats */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Score Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Launch Score" value={`${launchScore}/100`} />
          <StatCard label="Critical Issues" value={criticalWarnings.length} />
          <StatCard label="Warnings" value={minorWarnings.length} />
          <StatCard
            label="Deployment Gate"
            value={deployment.readyToDeploy ? "PASS" : "FAIL"}
          />
        </div>
      </section>

      {/* Score breakdown */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Score Breakdown</h2>
        <div className="rounded-lg border divide-y">
          {dimensions.map((d) => (
            <div className="px-4 py-4 space-y-2" key={d.label}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{d.label}</span>
                  <span className="text-xs text-muted-foreground">
                    weight {d.weight}%
                  </span>
                </div>
                <span
                  className={`font-mono font-semibold ${scoreColor(d.score)}`}
                >
                  {d.score}/100
                </span>
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {scoreBar(d.score)} {d.score}%
              </div>
              {d.warnings.length > 0 && (
                <ul className="text-xs space-y-0.5">
                  {d.warnings.map((w, i) => (
                    <li
                      className={
                        w.startsWith("✗")
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }
                      key={i}
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              {d.details.length > 0 && (
                <ul className="text-xs space-y-0.5 text-muted-foreground">
                  {d.details.slice(0, 4).map((det, i) => (
                    <li key={i}>{det}</li>
                  ))}
                  {d.details.length > 4 && (
                    <li>+{d.details.length - 4} more</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Critical issues */}
      {criticalWarnings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-red-600 dark:text-red-400">
            Critical Issues (must fix before launch)
          </h2>
          <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
            <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
              {criticalWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Minor warnings */}
      {minorWarnings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Warnings (address before or after launch)
          </h2>
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
            <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              {minorWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Debug links */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Validation Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          {[
            { href: "/admin/debug/sentry", label: "Sentry Validation" },
            { href: "/admin/debug/analytics", label: "Analytics Validation" },
            { href: "/admin/debug/ai-costs", label: "AI Cost Verification" },
            { href: "/admin/system", label: "System Health" },
            { href: "/admin/content-health", label: "Content Health" },
            { href: "/admin/launch", label: "Deployment Checks" },
            { href: "/admin/ai", label: "AI Usage" },
          ].map(({ href, label }) => (
            <a
              className="rounded-lg border p-3 hover:bg-muted transition-colors"
              href={href}
              key={href}
            >
              {label} →
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Post-deployment checklist</p>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          <li>
            Add Vercel env vars: SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY,
            POSTHOG_API_KEY, POSTHOG_PROJECT_ID, UPSTASH_REDIS_*
          </li>
          <li>Add GitHub secret SITE_URL for keep-alive workflow</li>
          <li>
            Run load test against preview URL:{" "}
            <code>npm run load-test https://preview.vercel.app</code>
          </li>
          <li>Complete mobile audit checklist: docs/mobile-audit.md</li>
          <li>Verify Sentry events at /admin/debug/sentry</li>
          <li>Verify analytics at /admin/debug/analytics (after traffic)</li>
        </ul>
      </section>
    </div>
  )
}
