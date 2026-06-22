"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextArea, TextInput } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import type { ProjectTradeoff } from "@/lib/public/project-case-study"
import { cn } from "@/lib/utils"

type TradeoffsFieldProps = {
  value: ProjectTradeoff[]
  onChange: (value: ProjectTradeoff[]) => void
  error?: string
}

export function TradeoffsField({ value, onChange, error }: TradeoffsFieldProps) {
  function updateItem(index: number, field: keyof ProjectTradeoff, next: string) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: next } : item
      )
    )
  }

  return (
    <div className="space-y-4">
      {value.map((item, index) => (
        <div className="space-y-3 rounded-lg border border-border p-4" key={`tradeoff-${index}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Tradeoff {index + 1}</p>
            <button
              aria-label="Remove tradeoff"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <TextInput
            onChange={(event) => updateItem(index, "decision", event.target.value)}
            placeholder="LangGraph"
            value={item.decision}
          />
          <TextInput
            onChange={(event) => updateItem(index, "alternative", event.target.value)}
            placeholder="CrewAI"
            value={item.alternative ?? ""}
          />
          <TextArea
            onChange={(event) => updateItem(index, "reason", event.target.value)}
            placeholder="Needed persistent state and branching workflows."
            rows={3}
            value={item.reason ?? item.tradeoff ?? ""}
          />
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={() => onChange([...value, { decision: "", alternative: "", reason: "" }])}
        type="button"
      >
        <Plus className="size-4" />
        Add tradeoff
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
