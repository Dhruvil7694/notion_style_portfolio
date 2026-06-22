import Link from "next/link"
import { Suspense } from "react"

import { DataTable, PageHeader } from "@/components/admin"
import { ListToolbar } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getConceptsList } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Concepts",
  robots: { index: false, follow: false },
}

type AdminConceptsPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminConceptsPage({ searchParams }: AdminConceptsPageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.concepts
  const { data: items, error } = await getConceptsList({ q: params.q })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New concept
          </Link>
        }
        description="CMS-managed concept authority pages."
        title="Concepts"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search concepts…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load concepts: {error.message}
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
          emptyDescription="Concept authority pages will appear here once created."
          emptyTitle="No concepts found."
          getRowKey={(row) => row.id}
          rows={items ?? []}
        />
      )}
    </div>
  )
}
