import { PageHeader, StatCard } from "@/components/admin"
import { runContentHealthAudit } from "@/lib/content-health/engine"

export const metadata = {
  title: "Content Health",
  robots: { index: false, follow: false },
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

function scoreBadge(score: number): string {
  if (score >= 80) return "Healthy"
  if (score >= 50) return "Warning"
  return "Critical"
}

export default async function ContentHealthPage() {
  const audit = await runContentHealthAudit()

  return (
    <div className="space-y-8">
      <PageHeader
        description="Audit content completeness and SEO readiness across projects and content."
        title="Content Health"
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Overall Score"
            value={`${audit.overallScore}%`}
          />
          <StatCard label="Healthy (≥80%)" value={audit.healthyCount} />
          <StatCard label="Warning (50–79%)" value={audit.warningCount} />
          <StatCard label="Critical (<50%)" value={audit.criticalCount} />
        </div>
      </section>

      {audit.projects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">
            Projects ({audit.projects.length})
          </h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Missing</th>
                </tr>
              </thead>
              <tbody>
                {audit.projects.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td
                      className={`px-4 py-3 font-mono font-semibold ${scoreColor(item.score)}`}
                    >
                      {item.score}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${scoreColor(item.score)}`}
                      >
                        {scoreBadge(item.score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.missing.length > 0
                        ? item.missing.join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {audit.content.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium">
            Content ({audit.content.length})
          </h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Missing</th>
                </tr>
              </thead>
              <tbody>
                {audit.content.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {item.type}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-semibold ${scoreColor(item.score)}`}
                    >
                      {item.score}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${scoreColor(item.score)}`}
                      >
                        {scoreBadge(item.score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.missing.length > 0
                        ? item.missing.join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {audit.totalItems === 0 && (
        <p className="text-sm text-muted-foreground">
          No published content found to audit.
        </p>
      )}
    </div>
  )
}
