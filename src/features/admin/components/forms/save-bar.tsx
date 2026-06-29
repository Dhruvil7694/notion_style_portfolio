"use client"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type SaveBarProps = {
  isSubmitting?: boolean
  isDeleting?: boolean
  onDelete?: () => void
  submitLabel?: string
  className?: string
}

export function SaveBar({
  isSubmitting,
  isDeleting,
  onDelete,
  submitLabel = "Save changes",
  className,
}: SaveBarProps) {
  return (
    <div
      className={cn(
        "border-border bg-background/95 sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 backdrop-blur md:-mx-8 md:px-8",
        className
      )}
    >
      <p className="text-muted-foreground text-xs">
        Changes are saved to the database on submit.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onDelete ? (
          <Button
            disabled={isSubmitting || isDeleting}
            onClick={onDelete}
            type="button"
            variant="destructive"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        ) : null}
        <Button disabled={isSubmitting || isDeleting} type="submit">
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  )
}
