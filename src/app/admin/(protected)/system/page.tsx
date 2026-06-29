import "server-only"

import { PageHeader } from "@/features/admin/components"
import {
  type CheckResult,
  mapCheckStatusToHealth,
  runDeploymentChecks,
} from "@/features/deployment/lib/checks"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "System Health",
  robots: { index: false, follow: false },
}

type CheckStatus = "pass" | "warn" | "fail"

type HealthCheck = {
  label: string
  group: string
  status: CheckStatus
  message: string
}

function toHealthChecks(
  sections: Awaited<ReturnType<typeof runDeploymentChecks>>["sections"]
): HealthCheck[] {
  return sections.flatMap((section) =>
    section.checks.map((check: CheckResult) => ({
      label: check.label,
      group: section.title,
      status: mapCheckStatusToHealth(check.status),
      message: check.detail
        ? `${check.message} — ${check.detail}`
        : check.message,
    }))
  )
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

export default async function SystemPage() {
  const result = await runDeploymentChecks()
  const checks = toHealthChecks(result.sections)
  const groups = [...new Set(checks.map((check) => check.group))]

  const passing = checks.filter((c) => c.status === "pass").length
  const total = checks.length

  return (
    <div className="space-y-6">
      <PageHeader
        description="Live deployment checks — same source of truth as Launch Readiness."
        title="System Health"
      />

      <div className="bg-card border rounded-lg px-4 py-3 text-sm font-medium">
        {passing}/{total} checks passing · {result.overallScore}% readiness
        score
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
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
                        className={i < groupChecks.length - 1 ? "border-b" : ""}
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
