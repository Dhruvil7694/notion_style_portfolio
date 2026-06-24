"use client"

import { cn } from "@/lib/utils"

type AssistantSuggestionsProps = {
  suggestions: string[]
  onSelect: (question: string) => void
  disabled?: boolean
  mobile?: boolean
}

export function AssistantSuggestions({
  suggestions,
  onSelect,
  disabled,
  mobile = false,
}: AssistantSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div
      className={cn("px-4 pb-3 pt-1", mobile && "assistant-suggestions-mobile")}
    >
      <p
        className={cn(
          "mb-2 font-medium uppercase tracking-wider text-muted-foreground",
          mobile ? "text-[11px]" : "text-[10px] text-muted-foreground/50"
        )}
      >
        Suggested
      </p>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((question) => (
          <button
            key={question}
            className={cn(
              "rounded-xl border px-3.5 py-3 text-left transition-colors",
              mobile
                ? "border-border/70 bg-secondary/40 text-[0.875rem] leading-snug text-foreground"
                : "rounded-lg border-border/40 bg-muted/20 py-2 text-[12px] text-muted-foreground",
              "hover:border-border hover:bg-muted/40 hover:text-foreground",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
            disabled={disabled}
            onClick={() => onSelect(question)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
