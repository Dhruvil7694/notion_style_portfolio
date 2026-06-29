"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useState } from "react"

import { DataTable } from "@/features/admin/components/data-table"
import { ListToolbar } from "@/features/admin/components/forms"
import { SkillForm } from "@/features/admin/components/forms/skill-form"
import { ListRowDeleteButton } from "@/features/admin/components/list-row-delete-button"
import { PageHeader } from "@/features/admin/components/page-header"
import { deleteSkill } from "@/features/admin/lib/actions/skills"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"

const routes = adminResourceRoutes.skills

export type SkillListRow = {
  id: string
  category: string
  name: string
  proficiency: string | null
  show_on_landing: boolean
}

const SKILL_SHEET_CLASS =
  "!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[28rem] sm:!max-w-[min(28rem,92vw)]"

type SkillsListPanelProps = {
  skills: SkillListRow[]
  errorMessage?: string
  initialCreateOpen?: boolean
}

export function SkillsListPanel({
  skills,
  errorMessage,
  initialCreateOpen = false,
}: SkillsListPanelProps) {
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
              New skill
            </button>
          }
          description="Metadata for technologies discovered from project and experience tech stacks."
          title="Skills"
        />

        <Suspense fallback={null}>
          <ListToolbar placeholder="Search skills…" />
        </Suspense>

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            Unable to load skills: {errorMessage}
          </p>
        ) : (
          <DataTable
            columns={[
              {
                key: "category",
                header: "Category",
                cell: (row) => (
                  <span className="capitalize">
                    {row.category.replaceAll("_", " ")}
                  </span>
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
              {
                key: "actions",
                header: "",
                className: "w-12 text-right",
                cell: (row) => (
                  <div className="flex justify-end">
                    <ListRowDeleteButton
                      entityLabel="skill"
                      itemLabel={row.name}
                      onDelete={deleteSkill.bind(null, row.id)}
                    />
                  </div>
                ),
              },
            ]}
            emptyDescription="Skills will appear here once created."
            emptyTitle="No skills found."
            getRowKey={(row) => row.id}
            rows={skills}
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
          className={SKILL_SHEET_CLASS}
          showCloseButton={false}
          side="right"
        >
          <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
            <SheetTitle className="sr-only">New skill</SheetTitle>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">New skill</p>
                <p className="text-muted-foreground text-xs">
                  Add stack metadata without leaving the list.
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
              <SkillForm
                key="new-skill"
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
