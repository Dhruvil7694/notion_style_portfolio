import { PageHeader, StatCard } from "@/components/admin"
import type { CheckResult } from "@/lib/deployment/checks"
import { runDeploymentChecks } from "@/lib/deployment/checks"

export const metadata = {
  title: "Launch Readiness",
  robots: { index: false, follow: false },
}

function CheckIcon({ status }: { status: CheckResult["status"] }) {
  if (status === "healthy") {
    return (
      <span className="font-bold text-green-600 dark:text-green-400">✓</span>
    )
  }
  if (status === "warning") {
    return (
      <span className="font-bold text-yellow-600 dark:text-yellow-400">⚠</span>
    )
  }
  return <span className="font-bold text-red-600 dark:text-red-400">✗</span>
}

function StatusBadge({
  status,
}: {
  status: "healthy" | "warning" | "critical"
}) {
  const classes =
    status === "healthy"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : status === "warning"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"

  const label =
    status === "healthy"
      ? "Healthy"
      : status === "warning"
        ? "Warning"
        : "Critical"

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}

export default async function LaunchPage() {
  const result = await runDeploymentChecks()

  return (
    <div className="space-y-8">
      <PageHeader
        description="Pre-deployment checklist for environment, security, and connectivity."
        title="Launch Readiness"
      />

      <section className="space-y-4">
        <div
          className={`rounded-lg border-2 p-4 text-center font-semibold tracking-wide ${
            result.readyToDeploy
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {result.readyToDeploy
            ? "✓ READY FOR DEPLOYMENT"
            : "✗ REQUIRES WORK BEFORE DEPLOYMENT"}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Summary</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Overall Score" value={`${result.overallScore}%`} />
          <StatCard
            label="Sections Healthy"
            value={result.sections.filter((s) => s.status === "healthy").length}
          />
          <StatCard
            label="Issues Found"
            value={
              result.sections
                .flatMap((s) => s.checks)
                .filter((c) => c.status !== "healthy").length
            }
          />
        </div>
      </section>

      <section className="space-y-6">
        {result.sections.map((section) => (
          <div key={section.title} className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-medium">{section.title}</h3>
              <StatusBadge status={section.status} />
            </div>
            <ul className="divide-y">
              {section.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-start gap-3 px-4 py-3 text-sm"
                >
                  <CheckIcon status={check.status} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{check.label}</span>
                    </div>
                    <p className="text-muted-foreground">{check.message}</p>
                    {check.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {check.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
