import Link from "next/link"
import { Suspense } from "react"

import { DataTable, PageHeader } from "@/components/admin"
import { ListToolbar } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getExpertiseAreasList } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Expertise",
  robots: { index: false, follow: false },
}

type AdminExpertisePageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminExpertisePage({ searchParams }: AdminExpertisePageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.expertise
  const { data: areas, error } = await getExpertiseAreasList({ q: params.q })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New expertise area
          </Link>
        }
        description="CMS-managed expertise domains for authority pages and knowledge graph linking."
        title="Expertise"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search expertise…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load expertise areas: {error.message}
        </p>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              header: "Title",
              cell: (row) => (
                <Link className="font-medium hover:underline" href={routes.edit(row.id)}>
                  {row.title}
                </Link>
              ),
            },
            { key: "slug", header: "Slug", cell: (row) => row.slug },
            {
              key: "status",
              header: "Status",
              cell: (row) => <span className="capitalize">{row.status}</span>,
            },
          ]}
          emptyDescription="Expertise areas will appear here once created."
          emptyTitle="No expertise areas found."
          getRowKey={(row) => row.id}
          rows={areas ?? []}
        />
      )}
    </div>
  )
}
