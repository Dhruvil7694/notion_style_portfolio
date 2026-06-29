"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextInput } from "@/features/admin/components/forms"
import type { ProjectFacts } from "@/features/knowledge-base/lib/schemas"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type FactsFieldProps = {
  value: ProjectFacts
  onChange: (value: ProjectFacts) => void
}

type FactRow = { key: string; value: string }

function factsToRows(facts: ProjectFacts): FactRow[] {
  const rows = Object.entries(facts).map(([key, value]) => ({ key, value }))
  return rows.length > 0 ? rows : [{ key: "", value: "" }]
}

function rowsToFacts(rows: FactRow[]): ProjectFacts {
  return rows.reduce<ProjectFacts>((acc, row) => {
    const key = row.key.trim()
    const value = row.value.trim()
    if (key && value) {
      acc[key] = value
    }
    return acc
  }, {})
}

export function FactsField({ value, onChange }: FactsFieldProps) {
  const rows = factsToRows(value)

  function updateRows(nextRows: FactRow[]) {
    onChange(rowsToFacts(nextRows))
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
          key={`fact-${index}`}
        >
          <TextInput
            onChange={(event) =>
              updateRows(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, key: event.target.value }
                    : item
                )
              )
            }
            placeholder="role"
            value={row.key}
          />
          <TextInput
            onChange={(event) =>
              updateRows(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, value: event.target.value }
                    : item
                )
              )
            }
            placeholder="Lead Engineer"
            value={row.value}
          />
          <button
            aria-label="Remove fact"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-destructive"
            )}
            onClick={() =>
              updateRows(rows.filter((_, itemIndex) => itemIndex !== index))
            }
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={() => updateRows([...rows, { key: "", value: "" }])}
        type="button"
      >
        <Plus className="size-4" />
        Add fact
      </button>
    </div>
  )
}
