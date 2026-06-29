import Link from "next/link"
import { Suspense } from "react"

import {
  DataTable,
  ListRowDeleteButton,
  PageHeader,
} from "@/features/admin/components"
import { ListToolbar } from "@/features/admin/components/forms"
import { deleteExperience } from "@/features/admin/lib/actions/experience"
import { getExperienceList } from "@/features/admin/lib/queries"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { cn, formatDate } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

export const metadata = {
  title: "Experience",
  robots: { index: false, follow: false },
}

type AdminExperiencePageProps = {
  searchParams: Promise<{ q?: string }>
}

function formatRange(start: string, end: string | null) {
  const startLabel = formatDate(start, "MMM yyyy")
  const endLabel = end ? formatDate(end, "MMM yyyy") : "Present"
  return `${startLabel} – ${endLabel}`
}

export default async function AdminExperiencePage({
  searchParams,
}: AdminExperiencePageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.experience
  const { data: experience, error } = await getExperienceList({ q: params.q })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New experience
          </Link>
        }
        description="Work history and professional roles."
        title="Experience"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search by role or company…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load experience: {error.message}
        </p>
      ) : (
        <DataTable
          columns={[
            {
              key: "role",
              header: "Role",
              cell: (row) => (
                <Link
                  className="font-medium hover:underline"
                  href={routes.edit(row.id)}
                >
                  {row.role}
                </Link>
              ),
            },
            {
              key: "company",
              header: "Company",
              cell: (row) => row.company,
            },
            {
              key: "dates",
              header: "Dates",
              cell: (row) => formatRange(row.start_date, row.end_date),
            },
            {
              key: "actions",
              header: "",
              className: "w-12 text-right",
              cell: (row) => (
                <div className="flex justify-end">
                  <ListRowDeleteButton
                    entityLabel="experience"
                    itemLabel={`${row.role} at ${row.company}`}
                    onDelete={deleteExperience.bind(null, row.id)}
                  />
                </div>
              ),
            },
          ]}
          emptyDescription="Experience entries will appear here once created."
          emptyTitle="No experience found."
          getRowKey={(row) => row.id}
          rows={experience ?? []}
        />
      )}
    </div>
  )
}
