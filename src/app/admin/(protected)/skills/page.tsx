import Link from "next/link"
import { Suspense } from "react"

import {
  DataTable,
  PageHeader,
} from "@/components/admin"
import { ListToolbar } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { getSkillsList } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Skills",
  robots: { index: false, follow: false },
}

type AdminSkillsPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminSkillsPage({
  searchParams,
}: AdminSkillsPageProps) {
  const params = await searchParams
  const routes = adminResourceRoutes.skills
  const { data: skills, error } = await getSkillsList({ q: params.q })

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href={routes.new}>
            New skill
          </Link>
        }
        description="Metadata for technologies discovered from project and experience tech stacks."
        title="Skills"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search skills…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load skills: {error.message}
        </p>
      ) : (
        <DataTable
          columns={[
            {
              key: "category",
              header: "Category",
              cell: (row) => (
                <span className="capitalize">{row.category.replaceAll("_", " ")}</span>
              ),
            },
            {
              key: "name",
              header: "Name",
              cell: (row) => (
                <Link
                  className="font-medium hover:underline"
                  href={routes.edit(row.id)}
                >
                  {row.name}
                </Link>
              ),
            },
            {
              key: "proficiency",
              header: "Proficiency",
              cell: (row) =>
                row.proficiency ? (
                  <span className="capitalize">{row.proficiency}</span>
                ) : (
                  "—"
                ),
            },
            {
              key: "show_on_landing",
              header: "Landing",
              cell: (row) => (row.show_on_landing ? "Yes" : "No"),
            },
          ]}
          emptyDescription="Skills will appear here once created."
          emptyTitle="No skills found."
          getRowKey={(row) => row.id}
          rows={skills ?? []}
        />
      )}
    </div>
  )
}
