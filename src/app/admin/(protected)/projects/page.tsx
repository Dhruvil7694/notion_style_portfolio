import Link from "next/link"
import { Suspense } from "react"

import {
  DataTable,
  ListRowDeleteButton,
  PageHeader,
  StatusBadge,
} from "@/features/admin/components"
import { ListToolbar } from "@/features/admin/components/forms"
import { ProjectsSortableList } from "@/features/admin/components/projects-sortable-list"
import { deleteProject } from "@/features/admin/lib/actions/projects"
import {
  getAllProjectsForOrder,
  getProjectsList,
} from "@/features/admin/lib/queries"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { cn, formatDateTime } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

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
  const canReorder = !params.q && (!params.status || params.status === "all")

  const listResult = canReorder
    ? await getAllProjectsForOrder()
    : await getProjectsList({
        q: params.q,
        status: params.status,
      })

  const { data: projects, error } = listResult

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
      ) : canReorder ? (
        <ProjectsSortableList projects={projects ?? []} />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Clear search and status filters to drag and reorder projects.
          </p>
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
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (row) => (
                  <div className="flex justify-end">
                    <ListRowDeleteButton
                      entityLabel="project"
                      itemLabel={row.title}
                      onDelete={deleteProject.bind(null, row.id)}
                    />
                  </div>
                ),
              },
            ]}
            emptyDescription="Projects will appear here once created."
            emptyTitle="No projects found."
            getRowKey={(row) => row.id}
            rows={projects ?? []}
          />
        </>
      )}
    </div>
  )
}
