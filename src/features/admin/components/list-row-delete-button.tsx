"use client"

import { Trash2 } from "lucide-react"
import { useState } from "react"

import { DeleteDialog } from "@/features/admin/components/forms/delete-dialog"
import type { ActionResult } from "@/features/admin/lib/schemas"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type ListRowDeleteButtonProps = {
  itemLabel: string
  entityLabel: string
  onDelete: () => Promise<ActionResult | void>
  disabled?: boolean
  className?: string
}

export function ListRowDeleteButton({
  itemLabel,
  entityLabel,
  onDelete,
  disabled = false,
  className,
}: ListRowDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setIsDeleting(true)
    setError(null)

    const result = await onDelete()

    if (result && !result.success) {
      setError(result.error ?? "Something went wrong. Try again.")
      setIsDeleting(false)
    }
  }

  function handleCancel() {
    if (isDeleting) {
      return
    }

    setOpen(false)
    setError(null)
  }

  return (
    <>
      <Button
        aria-label={`Delete ${itemLabel}`}
        className={cn(
          "text-muted-foreground hover:text-destructive size-8",
          className
        )}
        disabled={disabled || isDeleting}
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>

      <DeleteDialog
        description={
          error ??
          `This permanently removes “${itemLabel}”. This action cannot be undone.`
        }
        isDeleting={isDeleting}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        open={open}
        title={`Delete ${entityLabel}`}
      />
    </>
  )
}
