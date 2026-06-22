import Link from "next/link"
import { Suspense } from "react"

import {
  DataTable,
  PageHeader,
  StatusBadge,
} from "@/components/admin"
import { ListToolbar } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getProjectsList } from "@/lib/admin/queries"
import { cn, formatDateTime } from "@/lib/utils"

export const metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
}

type AdminProjectsPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function AdminProjectsPage({
  searchParams,
}: AdminProjectsPageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.projects
  const { data: projects, error } = await getProjectsList({
    q: params.q,
    status: params.status,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New project
          </Link>
        }
        description="Manage portfolio projects."
        title="Projects"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search projects…" showStatusFilter />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load projects: {error.message}
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
            {
              key: "status",
              header: "Status",
              cell: (row) => <StatusBadge value={row.status} />,
            },
            {
              key: "updated_at",
              header: "Updated At",
              cell: (row) => formatDateTime(row.updated_at),
            },
          ]}
          emptyDescription="Projects will appear here once created."
          emptyTitle="No projects found."
          getRowKey={(row) => row.id}
          rows={projects ?? []}
        />
      )}
    </div>
  )
}
