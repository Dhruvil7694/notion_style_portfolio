"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

import { DataTable } from "@/features/admin/components/data-table"
import { ListToolbar } from "@/features/admin/components/forms"
import { ConceptForm } from "@/features/admin/components/forms/concept-form"
import { ListRowDeleteButton } from "@/features/admin/components/list-row-delete-button"
import { PageHeader } from "@/features/admin/components/page-header"
import { deleteConceptEntry } from "@/features/admin/lib/actions/concepts"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"

const routes = adminResourceRoutes.concepts

export type ConceptListRow = {
  id: string
  title: string
  slug: string
  status: string
}

const CONCEPT_SHEET_CLASS =
  "!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[40rem] sm:!max-w-[min(40rem,92vw)]"

type ConceptsListPanelProps = {
  concepts: ConceptListRow[]
  errorMessage?: string
  initialCreateOpen?: boolean
}

export function ConceptsListPanel({
  concepts,
  errorMessage,
  initialCreateOpen = false,
}: ConceptsListPanelProps) {
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
              New concept
            </button>
          }
          description="CMS-managed concept authority pages."
          title="Concepts"
        />

        <Suspense fallback={null}>
          <ListToolbar placeholder="Search concepts…" />
        </Suspense>

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            Unable to load concepts: {errorMessage}
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
                      entityLabel="concept"
                      itemLabel={row.title}
                      onDelete={deleteConceptEntry.bind(null, row.id)}
                    />
                  </div>
                ),
              },
            ]}
            emptyDescription="Concept authority pages will appear here once created."
            emptyTitle="No concepts found."
            getRowKey={(row) => row.id}
            rows={concepts}
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
          className={CONCEPT_SHEET_CLASS}
          showCloseButton={false}
          side="right"
        >
          <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
            <SheetTitle className="sr-only">New concept</SheetTitle>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">New concept</p>
                <p className="text-muted-foreground text-xs">
                  Walk through the wizard without leaving the list.
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
              <ConceptForm
                key="new-concept"
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
