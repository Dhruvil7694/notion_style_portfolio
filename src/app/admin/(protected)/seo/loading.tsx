import { AdminPanel, PageHeader } from "@/features/admin/components"

export default function SeoAuditLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="SEO quality scores across all published content."
        title="SEO Audit"
      />
      <AdminPanel title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className="h-20 animate-pulse rounded-xl bg-muted/40"
              key={i}
            />
          ))}
        </div>
      </AdminPanel>
      <AdminPanel title="Content items">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              className="h-12 animate-pulse rounded-lg bg-muted/40"
              key={i}
            />
          ))}
        </div>
      </AdminPanel>
    </div>
  )
}
