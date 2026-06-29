import Link from "next/link"
import { Suspense } from "react"

import {
  DataTable,
  ListRowDeleteButton,
  PageHeader,
} from "@/features/admin/components"
import { ListToolbar } from "@/features/admin/components/forms"
import { deleteTechnologyEntry } from "@/features/admin/lib/actions/technologies"
import { getTechnologiesList } from "@/features/admin/lib/queries"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

export const metadata = {
  title: "Technologies",
  robots: { index: false, follow: false },
}

type AdminTechnologiesPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminTechnologiesPage({
  searchParams,
}: AdminTechnologiesPageProps) {
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
                <Link
                  className="font-medium hover:underline"
                  href={routes.edit(row.id)}
                >
                  {row.title}
                </Link>
              ),
            },
            { key: "slug", header: "Slug", cell: (row) => row.slug },
            {
              key: "category",
              header: "Category",
              cell: (row) => row.category ?? "—",
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <span className="capitalize">{row.status}</span>,
            },
            {
              key: "actions",
              header: "",
              className: "w-12 text-right",
              cell: (row) => (
                <div className="flex justify-end">
                  <ListRowDeleteButton
                    entityLabel="technology"
                    itemLabel={row.title}
                    onDelete={deleteTechnologyEntry.bind(null, row.id)}
                  />
                </div>
              ),
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
