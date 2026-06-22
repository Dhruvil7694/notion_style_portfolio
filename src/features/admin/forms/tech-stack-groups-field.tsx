"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextInput } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TechStackGroupDraft = {
  category: string
  items: string[]
}

type TechStackGroupsFieldProps = {
  value: TechStackGroupDraft[]
  onChange: (value: TechStackGroupDraft[]) => void
  error?: string
}

function normalizeGroups(value: TechStackGroupDraft[]): TechStackGroupDraft[] {
  return value.map((group) => ({
    category: group.category,
    items: group.items ?? [],
  }))
}

export function TechStackGroupsField({ value, onChange, error }: TechStackGroupsFieldProps) {
  const groups = normalizeGroups(value)

  function updateCategory(index: number, category: string) {
    onChange(
      groups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, category } : group
      )
    )
  }

  function updateItems(index: number, raw: string) {
    const items = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    onChange(
      groups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, items } : group
      )
    )
  }

  function addGroup() {
    onChange([...groups, { category: "", items: [] }])
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, groupIndex) => groupIndex !== index))
  }

  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <div className="space-y-3 rounded-lg border border-border p-4" key={`group-${index}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Category {index + 1}</p>
            <button
              aria-label="Remove category"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={() => removeGroup(index)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <TextInput
            onChange={(event) => updateCategory(index, event.target.value)}
            placeholder="Backend"
            value={group.category}
          />
          <TextInput
            onChange={(event) => updateItems(index, event.target.value)}
            placeholder="FastAPI, PostgreSQL, Redis"
            value={group.items.join(", ")}
          />
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addGroup}
        type="button"
      >
        <Plus className="size-4" />
        Add category
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
