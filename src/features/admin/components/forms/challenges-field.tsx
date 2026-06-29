"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextArea, TextInput } from "@/features/admin/components/forms"
import type { ProjectChallenge } from "@/features/portfolio/lib/project-case-study"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type ChallengesFieldProps = {
  value: ProjectChallenge[]
  onChange: (value: ProjectChallenge[]) => void
  error?: string
}

export function ChallengesField({
  value,
  onChange,
  error,
}: ChallengesFieldProps) {
  function updateItem(
    index: number,
    field: keyof ProjectChallenge,
    next: string
  ) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: next } : item
      )
    )
  }

  function addItem() {
    onChange([...value, { challenge: "", solution: "" }])
  }

  function removeItem(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-5">
      {value.map((item, index) => (
        <div
          className="space-y-3 rounded-lg border border-border p-4"
          key={`challenge-${index}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Challenge {index + 1}</p>
            <button
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove challenge</span>
            </button>
          </div>
          <TextInput
            onChange={(event) =>
              updateItem(index, "challenge", event.target.value)
            }
            placeholder="What was the engineering challenge?"
            value={item.challenge}
          />
          <TextArea
            onChange={(event) =>
              updateItem(index, "solution", event.target.value)
            }
            placeholder="How did you solve it?"
            rows={3}
            value={item.solution}
          />
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addItem}
        type="button"
      >
        <Plus className="size-4" />
        Add challenge
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
