"use client"

import { Plus, Trash2 } from "lucide-react"

import { TextArea, TextInput } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import type { FaqItem } from "@/lib/knowledge/schemas"
import { cn } from "@/lib/utils"

type FaqFieldProps = {
  value: FaqItem[]
  onChange: (value: FaqItem[]) => void
  error?: string
  onApplyTemplate?: () => FaqItem[]
}

export function FaqField({
  value,
  onChange,
  error,
  onApplyTemplate,
}: FaqFieldProps) {
  function updateItem(index: number, field: keyof FaqItem, next: string) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: next } : item
      )
    )
  }

  return (
    <div className="space-y-4">
      {value.map((item, index) => (
        <div
          className="space-y-3 rounded-lg border border-border p-4"
          key={`faq-${index}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">FAQ {index + 1}</p>
            <button
              aria-label="Remove FAQ item"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={() =>
                onChange(value.filter((_, itemIndex) => itemIndex !== index))
              }
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <TextInput
            onChange={(event) =>
              updateItem(index, "question", event.target.value)
            }
            placeholder="Question"
            value={item.question}
          />
          <TextArea
            onChange={(event) =>
              updateItem(index, "answer", event.target.value)
            }
            placeholder="Answer"
            rows={3}
            value={item.answer}
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => onChange([...value, { question: "", answer: "" }])}
          type="button"
        >
          <Plus className="size-4" />
          Add FAQ
        </button>
        {onApplyTemplate ? (
          <button
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            onClick={() => onChange(onApplyTemplate())}
            type="button"
          >
            Apply FAQ template
          </button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">
        Leave empty to use the auto-generated FAQ template on the public site.
      </p>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
