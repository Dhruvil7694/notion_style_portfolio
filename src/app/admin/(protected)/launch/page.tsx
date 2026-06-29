import { AdminPanel, PageHeader, StatCard } from "@/features/admin/components"
import {
  LaunchReadinessBanner,
  LaunchStatusBadge,
  LaunchStatusIcon,
} from "@/features/admin/components/launch-status"
import type { CheckResult } from "@/features/deployment/lib/checks"
import { runDeploymentChecks } from "@/features/deployment/lib/checks"
import { cn } from "@/shared/lib/utils"

export const metadata = {
  title: "Launch Readiness",
  robots: { index: false, follow: false },
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 text-sm">
      <LaunchStatusIcon className="mt-0.5" status={check.status} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">{check.label}</p>
        <p className="text-muted-foreground">{check.message}</p>
        {check.detail ? (
          <p className="text-muted-foreground/80 text-xs">{check.detail}</p>
        ) : null}
      </div>
    </li>
  )
}

export default async function LaunchPage() {
  const result = await runDeploymentChecks()
  const issueCount = result.sections
    .flatMap((section) => section.checks)
    .filter((check) => check.status !== "healthy").length
  const healthySections = result.sections.filter(
    (section) => section.status === "healthy"
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        description="Pre-deployment checklist for environment, security, and connectivity."
        title="Launch Readiness"
      />

      <LaunchReadinessBanner
        score={result.overallScore}
        status={result.readyToDeploy ? "healthy" : "critical"}
        subtitle={
          result.readyToDeploy
            ? "All deployment checks passed. Review warnings before shipping."
            : `${issueCount} issue${issueCount === 1 ? "" : "s"} must be resolved before deploy.`
        }
        title={
          result.readyToDeploy
            ? "Ready for deployment"
            : "Requires work before deployment"
        }
      />

      <AdminPanel
        description="Aggregate health across all check sections."
        title="Summary"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Overall score" value={`${result.overallScore}%`} />
          <StatCard
            label="Sections healthy"
            value={`${healthySections}/${result.sections.length}`}
          />
          <StatCard label="Issues found" value={issueCount} />
        </div>
      </AdminPanel>

      <div className="space-y-4">
        {result.sections.map((section) => (
          <AdminPanel
            actions={<LaunchStatusBadge status={section.status} />}
            key={section.title}
            title={section.title}
          >
            <ul
              className={cn(
                "border-border divide-border -mx-1 divide-y overflow-hidden rounded-lg border bg-background/60"
              )}
            >
              {section.checks.map((check) => (
                <CheckRow check={check} key={check.id} />
              ))}
            </ul>
          </AdminPanel>
        ))}
      </div>
    </div>
  )
}
