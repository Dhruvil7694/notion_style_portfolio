import Link from "next/link"
import { Suspense } from "react"

import {
  DataTable,
  PageHeader,
} from "@/components/admin"
import { ListToolbar } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getEducationList } from "@/lib/admin/queries"
import { cn, formatDate } from "@/lib/utils"

export const metadata = {
  title: "Education",
  robots: { index: false, follow: false },
}

type AdminEducationPageProps = {
  searchParams: Promise<{ q?: string }>
}

function formatRange(start: string | null, end: string | null) {
  if (!start) {
    return "—"
  }

  const startLabel = formatDate(start, "MMM yyyy")
  const endLabel = end ? formatDate(end, "MMM yyyy") : "Present"
  return `${startLabel} – ${endLabel}`
}

export default async function AdminEducationPage({
  searchParams,
}: AdminEducationPageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.education
  const { data: education, error } = await getEducationList({ q: params.q })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New education
          </Link>
        }
        description="Degrees, institutions, and academic history."
        title="Education"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search by institution or degree…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load education: {error.message}
        </p>
      ) : (
        <DataTable
          columns={[
            {
              key: "degree",
              header: "Degree",
              cell: (row) => (
                <Link
                  className="font-medium hover:underline"
                  href={routes.edit(row.id)}
                >
                  {row.degree}
                </Link>
              ),
            },
            {
              key: "institution",
              header: "Institution",
              cell: (row) => row.institution,
            },
            {
              key: "dates",
              header: "Dates",
              cell: (row) => formatRange(row.start_date, row.end_date),
            },
          ]}
          emptyDescription="Education entries will appear here once created."
          emptyTitle="No education found."
          getRowKey={(row) => row.id}
          rows={education ?? []}
        />
      )}
    </div>
  )
}
