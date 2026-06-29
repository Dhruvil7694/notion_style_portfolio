"use client"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type DeleteDialogProps = {
  open: boolean
  title: string
  description: string
  isDeleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({
  open,
  title,
  description,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      aria-labelledby="delete-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close delete dialog"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        type="button"
      />
      <div
        className={cn(
          "bg-background border-border relative w-full max-w-md rounded-lg border p-6 shadow-lg"
        )}
      >
        <h2 className="text-lg font-semibold" id="delete-dialog-title">
          {title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}
