"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import { TextInput } from "@/features/admin/components/forms"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type StepBuilderFieldProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
}

export function StepBuilderField({
  value,
  onChange,
  placeholder = "Step description",
  error,
}: StepBuilderFieldProps) {
  function updateStep(index: number, next: string) {
    onChange(
      value.map((step, stepIndex) => (stepIndex === index ? next : step))
    )
  }

  function addStep() {
    onChange([...value, ""])
  }

  function removeStep(index: number) {
    onChange(value.filter((_, stepIndex) => stepIndex !== index))
  }

  function moveStep(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= value.length) {
      return
    }

    const next = [...value]
    const item = next.splice(index, 1)[0]
    if (item === undefined) {
      return
    }
    next.splice(nextIndex, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {value.map((step, index) => (
          <div
            className="flex items-center gap-2 rounded-lg border border-border p-3"
            key={`step-${index}`}
          >
            <span className="text-muted-foreground w-6 shrink-0 text-center text-xs tabular-nums">
              {index + 1}
            </span>
            <TextInput
              className="min-w-0 flex-1"
              onChange={(event) => updateStep(index, event.target.value)}
              placeholder={placeholder}
              value={step}
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                aria-label="Move step up"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" })
                )}
                disabled={index === 0}
                onClick={() => moveStep(index, -1)}
                type="button"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                aria-label="Move step down"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" })
                )}
                disabled={index === value.length - 1}
                onClick={() => moveStep(index, 1)}
                type="button"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                aria-label="Remove step"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-muted-foreground hover:text-destructive"
                )}
                onClick={() => removeStep(index)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addStep}
        type="button"
      >
        <Plus className="size-4" />
        Add step
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
