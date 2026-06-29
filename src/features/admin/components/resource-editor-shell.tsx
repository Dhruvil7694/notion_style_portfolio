import Link from "next/link"

import { EmptyState } from "@/features/admin/components/empty-state"
import { PageHeader } from "@/features/admin/components/page-header"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type ResourceEditorShellProps = {
  title: string
  description: string
  backHref: string
  mode: "create" | "edit"
  recordLabel?: string
}

export function ResourceEditorShell({
  title,
  description,
  backHref,
  mode,
  recordLabel,
}: ResourceEditorShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader description={description} title={title} />
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href={backHref}
        >
          Back to list
        </Link>
      </div>

      <EmptyState
        description={
          mode === "create"
            ? "The create form will be implemented in Phase 6."
            : `The editor for ${recordLabel ?? "this record"} will be implemented in Phase 6.`
        }
        title={
          mode === "create"
            ? "Create view placeholder"
            : "Edit view placeholder"
        }
      />
    </div>
  )
}
