import { AdminPanel, PageHeader, StatCard } from "@/features/admin/components"
import { GeoAuditPanel } from "@/features/admin/components/geo-audit-panel"
import { runGeoAudit } from "@/features/geo/lib/audit/engine"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "GEO",
  robots: { index: false, follow: false },
}

export default async function GeoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const highlightId =
    typeof params["highlight"] === "string" ? params["highlight"] : undefined
  const result = await runGeoAudit()

  return (
    <div className="space-y-6">
      <PageHeader
        description="Generative Engine Optimization — entity prominence and citation signals for LLM-generated content."
        title="GEO"
      />

      <AdminPanel
        description="Aggregate GEO scores across published content."
        title="Overview"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Avg Score" value={`${result.avgScore}%`} />
          <StatCard label="Prominent (≥70)" value={result.prominentCount} />
          <StatCard label="Emerging (35–69)" value={result.emergingCount} />
          <StatCard label="Absent (<35)" value={result.absentCount} />
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
          <GeoAuditPanel highlightId={highlightId} result={result} />
        </AdminPanel>
      )}
    </div>
  )
}
