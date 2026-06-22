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
import { getContentList } from "@/lib/admin/queries"
import { cn, formatDateTime } from "@/lib/utils"

export const metadata = {
  title: "Content",
  robots: { index: false, follow: false },
}

type AdminContentPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function AdminContentPage({
  searchParams,
}: AdminContentPageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.content
  const { data: content, error } = await getContentList({
    q: params.q,
    status: params.status,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New content
          </Link>
        }
        description="Blogs, research, automation, publications, and notes."
        title="Content"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search content…" showStatusFilter />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load content: {error.message}
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
              key: "type",
              header: "Type",
              cell: (row) => (
                <span className="capitalize">{row.type.replaceAll("_", " ")}</span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <StatusBadge value={row.status} />,
            },
            {
              key: "published_at",
              header: "Published At",
              cell: (row) =>
                row.published_at ? formatDateTime(row.published_at) : "—",
            },
          ]}
          emptyDescription="Content items will appear here once created."
          emptyTitle="No content found."
          getRowKey={(row) => row.id}
          rows={content ?? []}
        />
      )}
    </div>
  )
}
