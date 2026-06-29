"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

import { DataTable } from "@/features/admin/components/data-table"
import { ListToolbar } from "@/features/admin/components/forms"
import { EducationForm } from "@/features/admin/components/forms/education-form"
import { PageHeader } from "@/features/admin/components/page-header"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { cn, formatDate } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"

const routes = adminResourceRoutes.education

export type EducationListRow = {
  id: string
  degree: string
  institution: string
  start_date: string | null
  end_date: string | null
}

const EDUCATION_SHEET_CLASS =
  "!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[28rem] sm:!max-w-[min(28rem,92vw)]"

function formatRange(start: string | null, end: string | null) {
  if (!start) {
    return "—"
  }

  const startLabel = formatDate(start, "MMM yyyy")
  const endLabel = end ? formatDate(end, "MMM yyyy") : "Present"
  return `${startLabel} – ${endLabel}`
}

type EducationListPanelProps = {
  education: EducationListRow[]
  errorMessage?: string
  initialCreateOpen?: boolean
}

export function EducationListPanel({
  education,
  errorMessage,
  initialCreateOpen = false,
}: EducationListPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)

  useEffect(() => {
    setCreateOpen(initialCreateOpen)
  }, [initialCreateOpen])

  const closeCreatePanel = useCallback(() => {
    setCreateOpen(false)

    if (searchParams.get("create") === "1") {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("create")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    }
  }, [pathname, router, searchParams])

  const handleCreateSuccess = useCallback(() => {
    closeCreatePanel()
    router.refresh()
  }, [closeCreatePanel, router])

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <button
              className={cn(buttonVariants())}
              onClick={() => setCreateOpen(true)}
              type="button"
            >
              New education
            </button>
          }
          description="Degrees, institutions, and academic history."
          title="Education"
        />

        <Suspense fallback={null}>
          <ListToolbar placeholder="Search by institution or degree…" />
        </Suspense>

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            Unable to load education: {errorMessage}
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
            rows={education}
          />
        )}
      </div>

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            closeCreatePanel()
            return
          }
          setCreateOpen(true)
        }}
        open={createOpen}
      >
        <SheetContent
          className={EDUCATION_SHEET_CLASS}
          showCloseButton={false}
          side="right"
        >
          <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
            <SheetTitle className="sr-only">New education</SheetTitle>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">New education</p>
                <p className="text-muted-foreground text-xs">
                  Add a degree or certification without leaving the list.
                </p>
              </div>
              <button
                aria-label="Close panel"
                className="text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                onClick={closeCreatePanel}
                type="button"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {createOpen ? (
              <EducationForm
                key="new-education"
                mode="create"
                onCancel={closeCreatePanel}
                onSuccess={handleCreateSuccess}
                variant="panel"
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
