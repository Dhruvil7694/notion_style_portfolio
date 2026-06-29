"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextArea, TextInput } from "@/features/admin/components/forms"
import type { ProjectTimelineEntry } from "@/features/portfolio/lib/project-case-study"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type TimelineFieldProps = {
  value: ProjectTimelineEntry[]
  onChange: (value: ProjectTimelineEntry[]) => void
  error?: string
}

export function TimelineField({ value, onChange, error }: TimelineFieldProps) {
  function updateItem(
    index: number,
    field: keyof ProjectTimelineEntry,
    next: string
  ) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: next } : item
      )
    )
  }

  function addItem() {
    onChange([...value, { period: "", title: "", description: "" }])
  }

  function removeItem(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-5">
      {value.map((item, index) => (
        <div
          className="space-y-3 rounded-lg border border-border p-4"
          key={`timeline-${index}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Entry {index + 1}</p>
            <button
              aria-label="Remove timeline entry"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <TextInput
              onChange={(event) =>
                updateItem(index, "period", event.target.value)
              }
              placeholder="Q1 2025"
              value={item.period}
            />
            <TextInput
              onChange={(event) =>
                updateItem(index, "title", event.target.value)
              }
              placeholder="MVP shipped to production"
              value={item.title}
            />
          </div>
          <TextArea
            onChange={(event) =>
              updateItem(index, "description", event.target.value)
            }
            placeholder="Optional context for this milestone."
            rows={2}
            value={item.description ?? ""}
          />
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addItem}
        type="button"
      >
        <Plus className="size-4" />
        Add timeline entry
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
