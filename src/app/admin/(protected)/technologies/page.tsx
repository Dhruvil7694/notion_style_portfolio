import Link from "next/link"
import { Suspense } from "react"

import { DataTable, PageHeader } from "@/components/admin"
import { ListToolbar } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getTechnologiesList } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Technologies",
  robots: { index: false, follow: false },
}

type AdminTechnologiesPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminTechnologiesPage({ searchParams }: AdminTechnologiesPageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.technologies
  const { data: items, error } = await getTechnologiesList({ q: params.q })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New technology
          </Link>
        }
        description="CMS-managed technology knowledge hubs."
        title="Technologies"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search technologies…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load technologies: {error.message}
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
            { key: "category", header: "Category", cell: (row) => row.category ?? "—" },
            {
              key: "status",
              header: "Status",
              cell: (row) => <span className="capitalize">{row.status}</span>,
            },
          ]}
          emptyDescription="Technology hubs will appear here once created."
          emptyTitle="No technologies found."
          getRowKey={(row) => row.id}
          rows={items ?? []}
        />
      )}
    </div>
  )
}
