import { AdminPanel, PageHeader, StatCard } from "@/features/admin/components"
import { SeoAuditPanel } from "@/features/admin/components/seo-audit-panel"
import { runSeoAudit } from "@/features/seo/lib/audit/engine"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "SEO Audit",
  robots: { index: false, follow: false },
}

export default async function SeoAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const highlightId =
    typeof params["highlight"] === "string" ? params["highlight"] : undefined
  const result = await runSeoAudit()

  return (
    <div className="space-y-6">
      <PageHeader
        description="SEO quality scores across all published content. Worst items first."
        title="SEO Audit"
      />

      <AdminPanel description="Aggregate SEO quality scores." title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Avg Score" value={`${result.avgScore}%`} />
          <StatCard label="Healthy (≥80)" value={result.healthyCount} />
          <StatCard label="Warning (50–79)" value={result.warningCount} />
          <StatCard label="Critical (<50)" value={result.criticalCount} />
        </div>
      </AdminPanel>

      {result.totalCount === 0 ? (
        <AdminPanel title="No content">
          <p className="text-sm text-muted-foreground">
            No published content found to audit.
          </p>
        </AdminPanel>
      ) : (
        <AdminPanel
          description={`${result.totalCount} published items · audited ${new Date(result.auditedAt).toLocaleTimeString()}`}
          title="Content items"
        >
          <SeoAuditPanel highlightId={highlightId} result={result} />
        </AdminPanel>
      )}
    </div>
  )
}
