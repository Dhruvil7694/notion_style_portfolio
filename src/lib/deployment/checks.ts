import "server-only"

import { getPublicSettings } from "@/lib/public/queries"
import { isDistributedRateLimitConfigured } from "@/lib/security/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"

import { checkEnvVar, checkUrl } from "./validators"

export type CheckResult = {
  id: string
  label: string
  status: "healthy" | "warning" | "critical"
  message: string
  detail?: string
}

export type DeploymentSection = {
  title: string
  checks: CheckResult[]
  status: "healthy" | "warning" | "critical"
}

function sectionStatus(
  checks: CheckResult[]
): "healthy" | "warning" | "critical" {
  if (checks.some((c) => c.status === "critical")) return "critical"
  if (checks.some((c) => c.status === "warning")) return "warning"
  return "healthy"
}

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/$/, "")
}

async function checkSiteUrlConsistency(): Promise<CheckResult> {
  const envUrl = process.env.SITE_URL?.trim()
  const settings = await getPublicSettings()
  const cmsUrl = settings.site.site_url?.trim()

  if (!envUrl) {
    return {
      id: "site_url_env",
      label: "SITE_URL",
      status: "critical",
      message: "SITE_URL is not set",
      detail:
        "Required for canonical URLs, OG images, sitemap, JSON-LD, and llms.txt",
    }
  }

  if (!cmsUrl) {
    return {
      id: "site_url_cms",
      label: "CMS site_url",
      status: "warning",
      message:
        "CMS site_url not set — canonical URLs fall back to SITE_URL env",
    }
  }

  if (normalizeSiteUrl(envUrl) !== normalizeSiteUrl(cmsUrl)) {
    return {
      id: "seo_configuration_mismatch",
      label: "SEO Configuration Mismatch",
      status: "critical",
      message: "SITE_URL does not match CMS site_url",
      detail: `SITE_URL=${normalizeSiteUrl(envUrl)}, CMS=${normalizeSiteUrl(cmsUrl)}. Canonical URLs, OG images, sitemap, JSON-LD, and llms.txt depend on alignment.`,
    }
  }

  return {
    id: "site_url_consistency",
    label: "Site URL Consistency",
    status: "healthy",
    message: "SITE_URL matches CMS site_url",
  }
}

function checkRateLimiting(): CheckResult {
  const configured = isDistributedRateLimitConfigured()
  const isProduction = process.env.NODE_ENV === "production"

  if (configured) {
    return {
      id: "upstash_redis",
      label: "Rate Limiting (Upstash)",
      status: "healthy",
      message: "Distributed rate limiting configured",
    }
  }

  if (isProduction) {
    return {
      id: "production_rate_limiting_disabled",
      label: "Production Rate Limiting Disabled",
      status: "critical",
      message:
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production",
      detail:
        "Without Upstash, rate limits use in-memory fallback (non-functional on Vercel serverless)",
    }
  }

  return {
    id: "upstash_redis",
    label: "Rate Limiting (Upstash)",
    status: "warning",
    message: "Using in-memory rate limiting (development only)",
  }
}

function runSecurityChecks(): CheckResult[] {
  const checks: CheckResult[] = [
    checkEnvVar("SUPABASE_SECRET_KEY"),
    checkEnvVar("ADMIN_EMAIL"),
    checkEnvVar("SITE_URL"),
  ]

  const nodeEnv = process.env.NODE_ENV
  checks.push(
    nodeEnv === "production"
      ? {
          id: "node_env",
          label: "NODE_ENV",
          status: "healthy",
          message: "NODE_ENV is set to production",
        }
      : {
          id: "node_env",
          label: "NODE_ENV",
          status: "warning",
          message: `NODE_ENV is "${nodeEnv ?? "unset"}"`,
          detail: "Set NODE_ENV=production for deployment",
        }
  )

  return checks
}

function runAiChecks(): CheckResult[] {
  const providers = [
    { env: "ANTHROPIC_API_KEY", label: "Anthropic" },
    { env: "OPENAI_API_KEY", label: "OpenAI" },
    { env: "GOOGLE_GENERATIVE_AI_API_KEY", label: "Google AI" },
    { env: "GROQ_API_KEY", label: "Groq" },
    { env: "OPENROUTER_API_KEY", label: "OpenRouter" },
  ]

  const configured = providers.filter((p) => Boolean(process.env[p.env]))

  if (configured.length === 0) {
    return [
      {
        id: "ai_provider",
        label: "AI Provider",
        status: "warning",
        message: "No AI provider keys found in environment",
        detail:
          "Set at least one provider key in env or CMS AI settings for assistant/copilot",
      },
    ]
  }

  return configured.map((p) => ({
    id: `ai_${p.label.toLowerCase().replace(/\s+/g, "_")}`,
    label: `${p.label} API Key`,
    status: "healthy" as const,
    message: `${p.label} API key is configured`,
  }))
}

async function runDatabaseChecks(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [
    checkEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    checkEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  ]

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from("settings")
      .select("key", { count: "exact", head: true })

    checks.push(
      error
        ? {
            id: "db_connectivity",
            label: "Database Connectivity",
            status: "critical",
            message: "Cannot connect to Supabase",
            detail: error.message,
          }
        : {
            id: "db_connectivity",
            label: "Database Connectivity",
            status: "healthy",
            message: "Supabase connection successful",
          }
    )
  } catch (err) {
    checks.push({
      id: "db_connectivity",
      label: "Database Connectivity",
      status: "critical",
      message: "Database connection failed",
      detail: err instanceof Error ? err.message : "Unknown error",
    })
  }

  return checks
}

async function runSeoChecks(): Promise<CheckResult[]> {
  const siteUrlCheck = checkUrl(process.env.SITE_URL, "SITE_URL")
  const consistencyCheck = await checkSiteUrlConsistency()

  return [siteUrlCheck, consistencyCheck]
}

function runInfrastructureChecks(): CheckResult[] {
  const checks: CheckResult[] = [checkRateLimiting()]

  checks.push(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
      ? {
          id: "sentry_dsn",
          label: "Monitoring (Sentry)",
          status: "healthy",
          message: "Sentry DSN configured",
        }
      : {
          id: "sentry_dsn",
          label: "Monitoring (Sentry)",
          status: "warning",
          message: "Sentry DSN not configured",
          detail: "Recommended for production error tracking",
        }
  )

  checks.push(
    process.env.NEXT_PUBLIC_POSTHOG_KEY
      ? {
          id: "posthog_key",
          label: "Analytics (PostHog)",
          status: "healthy",
          message: "NEXT_PUBLIC_POSTHOG_KEY configured",
        }
      : {
          id: "posthog_key",
          label: "Analytics (PostHog)",
          status: "warning",
          message: "PostHog not configured",
          detail: "Optional — analytics will be disabled",
        }
  )

  return checks
}

export function mapCheckStatusToHealth(
  status: CheckResult["status"]
): "pass" | "warn" | "fail" {
  if (status === "healthy") return "pass"
  if (status === "warning") return "warn"
  return "fail"
}

export async function runDeploymentChecks(): Promise<{
  sections: DeploymentSection[]
  overallScore: number
  readyToDeploy: boolean
}> {
  const [dbChecks, seoChecks] = await Promise.all([
    runDatabaseChecks(),
    runSeoChecks(),
  ])

  const securityChecks = runSecurityChecks()
  const aiChecks = runAiChecks()
  const infrastructureChecks = runInfrastructureChecks()

  const sections: DeploymentSection[] = [
    {
      title: "Security",
      checks: securityChecks,
      status: sectionStatus(securityChecks),
    },
    {
      title: "Environment",
      checks: [
        checkEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
        checkEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
        checkEnvVar("SUPABASE_SECRET_KEY"),
        checkEnvVar("ADMIN_EMAIL"),
        checkEnvVar("SITE_URL"),
      ],
      status: sectionStatus([
        checkEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
        checkEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
        checkEnvVar("SUPABASE_SECRET_KEY"),
        checkEnvVar("ADMIN_EMAIL"),
        checkEnvVar("SITE_URL"),
      ]),
    },
    {
      title: "AI Providers",
      checks: aiChecks,
      status: sectionStatus(aiChecks),
    },
    {
      title: "Database",
      checks: dbChecks,
      status: sectionStatus(dbChecks),
    },
    {
      title: "SEO & URLs",
      checks: seoChecks,
      status: sectionStatus(seoChecks),
    },
    {
      title: "Infrastructure",
      checks: infrastructureChecks,
      status: sectionStatus(infrastructureChecks),
    },
  ]

  const allChecks = sections.flatMap((s) => s.checks)
  const totalChecks = allChecks.length
  const passedChecks = allChecks.filter((c) => c.status === "healthy").length
  const overallScore =
    totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

  const readyToDeploy = sections.every((s) => s.status !== "critical")

  return { sections, overallScore, readyToDeploy }
}
