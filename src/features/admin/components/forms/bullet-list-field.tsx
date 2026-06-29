"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextInput } from "@/features/admin/components/forms"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type BulletListFieldProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  addLabel?: string
  error?: string
}

export function BulletListField({
  value,
  onChange,
  placeholder = "List item",
  addLabel = "Add item",
  error,
}: BulletListFieldProps) {
  function updateItem(index: number, next: string) {
    onChange(
      value.map((item, itemIndex) => (itemIndex === index ? next : item))
    )
  }

  function addItem() {
    onChange([...value, ""])
  }

  function removeItem(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            className="flex items-center gap-2 rounded-lg border border-border p-3"
            key={`item-${index}`}
          >
            <span
              aria-hidden
              className="text-muted-foreground w-4 shrink-0 text-center"
            >
              ·
            </span>
            <TextInput
              className="min-w-0 flex-1"
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder={placeholder}
              value={item}
            />
            <button
              aria-label="Remove item"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "text-muted-foreground hover:text-destructive shrink-0"
              )}
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addItem}
        type="button"
      >
        <Plus className="size-4" />
        {addLabel}
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
