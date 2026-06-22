import "server-only"

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

async function runSecurityChecks(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [
    checkEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    checkEnvVar("ADMIN_EMAIL"),
    checkEnvVar("NEXTAUTH_SECRET"),
  ]

  const nodeEnv = process.env["NODE_ENV"]
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
  ]

  const configured = providers.filter((p) => Boolean(process.env[p.env]))

  if (configured.length === 0) {
    return [
      {
        id: "ai_provider",
        label: "AI Provider",
        status: "warning",
        message: "No AI provider keys found",
        detail:
          "Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY",
      },
    ]
  }

  return configured.map((p) => ({
    id: `ai_${p.label.toLowerCase()}`,
    label: `${p.label} API Key`,
    status: "healthy" as const,
    message: `${p.label} API key is configured`,
  }))
}

async function runDatabaseChecks(): Promise<CheckResult[]> {
  const supabaseUrl = checkEnvVar("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseKey = checkEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  const checks: CheckResult[] = [supabaseUrl, supabaseKey]

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

function runSeoChecks(): CheckResult[] {
  const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"]
  return [checkUrl(siteUrl, "NEXT_PUBLIC_SITE_URL")]
}

function runEnvChecks(): CheckResult[] {
  return [
    checkEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    checkEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    checkEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    checkEnvVar("ADMIN_EMAIL"),
  ]
}

export async function runDeploymentChecks(): Promise<{
  sections: DeploymentSection[]
  overallScore: number
  readyToDeploy: boolean
}> {
  const [securityChecks, dbChecks] = await Promise.all([
    runSecurityChecks(),
    runDatabaseChecks(),
  ])

  const sections: DeploymentSection[] = [
    {
      title: "Security",
      checks: securityChecks,
      status: sectionStatus(securityChecks),
    },
    {
      title: "AI Providers",
      checks: runAiChecks(),
      status: sectionStatus(runAiChecks()),
    },
    {
      title: "Database",
      checks: dbChecks,
      status: sectionStatus(dbChecks),
    },
    {
      title: "SEO & URLs",
      checks: runSeoChecks(),
      status: sectionStatus(runSeoChecks()),
    },
    {
      title: "Environment",
      checks: runEnvChecks(),
      status: sectionStatus(runEnvChecks()),
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
