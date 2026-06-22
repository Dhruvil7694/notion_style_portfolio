import { PageHeader } from "@/components/admin"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "System Health",
  robots: { index: false, follow: false },
}

type CheckStatus = "pass" | "warn" | "fail"

type HealthCheck = {
  label: string
  group: "Security" | "Database" | "AI" | "Infrastructure"
  status: CheckStatus
  message: string
}

async function runHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []

  // --- Database ---
  let dbStatus: CheckStatus = "pass"
  let dbMessage = "Connected successfully"
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("projects")
      .select("id")
      .limit(1)
    if (error) {
      dbStatus = "fail"
      dbMessage = error.message
    }
  } catch (err) {
    dbStatus = "fail"
    dbMessage = err instanceof Error ? err.message : "Unknown error"
  }
  checks.push({
    label: "Supabase connectivity",
    group: "Database",
    status: dbStatus,
    message: dbMessage,
  })

  // --- Security / required env vars ---
  const requiredVars: Array<{ key: string; label: string }> = [
    { key: "SITE_URL", label: "SITE_URL" },
    { key: "ADMIN_EMAIL", label: "ADMIN_EMAIL" },
    { key: "SUPABASE_SECRET_KEY", label: "SUPABASE_SECRET_KEY" },
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "NEXT_PUBLIC_SUPABASE_URL",
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      label: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    },
  ]

  for (const { key, label } of requiredVars) {
    const value = process.env[key]
    checks.push({
      label,
      group: "Security",
      status: value ? "pass" : "fail",
      message: value ? "Set" : "Not set — required",
    })
  }

  // --- AI providers ---
  const aiProviders: Array<{ key: string; label: string }> = [
    { key: "OPENAI_API_KEY", label: "OpenAI" },
    { key: "ANTHROPIC_API_KEY", label: "Anthropic" },
    { key: "GOOGLE_GENERATIVE_AI_API_KEY", label: "Google Generative AI" },
  ]

  for (const { key, label } of aiProviders) {
    const value = process.env[key]
    checks.push({
      label,
      group: "AI",
      status: value ? "pass" : "warn",
      message: value ? "Key set" : "Not set — optional",
    })
  }

  // --- Infrastructure ---
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const upstashOk = Boolean(upstashUrl && upstashToken)
  checks.push({
    label: "Rate limiting (Upstash Redis)",
    group: "Infrastructure",
    status: upstashOk ? "pass" : "warn",
    message: upstashOk
      ? "UPSTASH_REDIS_REST_URL and TOKEN set"
      : "Not configured — falls back to in-memory (broken on Vercel)",
  })

  checks.push({
    label: "Monitoring (Sentry)",
    group: "Infrastructure",
    status: process.env.SENTRY_DSN ? "pass" : "warn",
    message: process.env.SENTRY_DSN ? "SENTRY_DSN set" : "Not set — optional",
  })

  checks.push({
    label: "Analytics (PostHog)",
    group: "Infrastructure",
    status: process.env.NEXT_PUBLIC_POSTHOG_KEY ? "pass" : "warn",
    message: process.env.NEXT_PUBLIC_POSTHOG_KEY
      ? "NEXT_PUBLIC_POSTHOG_KEY set"
      : "Not set — optional",
  })

  return checks
}

const STATUS_STYLES: Record<CheckStatus, string> = {
  pass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warn: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  fail: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: "Pass",
  warn: "Warn",
  fail: "Fail",
}

const GROUPS = ["Security", "Database", "AI", "Infrastructure"] as const

export default async function SystemPage() {
  const checks = await runHealthChecks()

  const passing = checks.filter((c) => c.status === "pass").length
  const total = checks.length

  return (
    <div className="space-y-6">
      <PageHeader
        description="Live system health checks run on each page load."
        title="System Health"
      />

      <div className="bg-card border rounded-lg px-4 py-3 text-sm font-medium">
        {passing}/{total} checks passing
      </div>

      <div className="space-y-6">
        {GROUPS.map((group) => {
          const groupChecks = checks.filter((c) => c.group === group)
          if (groupChecks.length === 0) return null

          return (
            <section key={group}>
              <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                {group}
              </h2>
              <div className="bg-card border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                        Check
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                        Status
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-left font-medium">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupChecks.map((check, i) => (
                      <tr
                        key={check.label}
                        className={
                          i < groupChecks.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="px-4 py-2 font-mono text-xs">
                          {check.label}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[check.status]}`}
                          >
                            {STATUS_LABEL[check.status]}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-4 py-2 text-xs">
                          {check.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
