import { AdminPanel, PageHeader, StatCard } from "@/features/admin/components"
import { AeoAuditPanel } from "@/features/admin/components/aeo-audit-panel"
import { runAeoAudit } from "@/features/aeo/lib/audit/engine"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "AEO",
  robots: { index: false, follow: false },
}

export default async function AeoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const highlightId =
    typeof params["highlight"] === "string" ? params["highlight"] : undefined
  const result = await runAeoAudit()

  return (
    <div className="space-y-6">
      <PageHeader
        description="Answer Engine Optimization — scores for AI assistants, voice search, and featured snippet coverage."
        title="AEO"
      />

      <AdminPanel
        description="Aggregate AEO scores across published content."
        title="Overview"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Avg Score" value={`${result.avgScore}%`} />
          <StatCard label="Optimized (≥75)" value={result.optimizedCount} />
          <StatCard label="Partial (40–74)" value={result.partialCount} />
          <StatCard label="Missing (<40)" value={result.missingCount} />
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
          <AeoAuditPanel highlightId={highlightId} result={result} />
        </AdminPanel>
      )}
    </div>
  )
}
