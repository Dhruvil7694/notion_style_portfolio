"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextInput } from "@/features/admin/components/forms"
import type { ProjectMetric } from "@/features/portfolio/lib/project-case-study"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type MetricsFieldProps = {
  value: ProjectMetric[]
  onChange: (value: ProjectMetric[]) => void
  error?: string
}

export function MetricsField({ value, onChange, error }: MetricsFieldProps) {
  function updateItem(index: number, field: keyof ProjectMetric, next: string) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: next } : item
      )
    )
  }

  function addItem() {
    onChange([...value, { label: "", value: "" }])
  }

  function removeItem(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-5">
      {value.map((item, index) => (
        <div
          className="grid gap-3 rounded-lg border border-border p-4 lg:grid-cols-[1fr_1fr_auto]"
          key={`metric-${index}`}
        >
          <TextInput
            onChange={(event) => updateItem(index, "value", event.target.value)}
            placeholder="40% faster triage"
            value={item.value}
          />
          <TextInput
            onChange={(event) => updateItem(index, "label", event.target.value)}
            placeholder="Incident response time"
            value={item.label}
          />
          <button
            aria-label="Remove metric"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-muted-foreground hover:text-destructive"
            )}
            onClick={() => removeItem(index)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addItem}
        type="button"
      >
        <Plus className="size-4" />
        Add metric
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
