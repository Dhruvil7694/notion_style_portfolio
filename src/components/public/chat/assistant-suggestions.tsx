"use client"

import { cn } from "@/lib/utils"

type AssistantSuggestionsProps = {
  suggestions: string[]
  onSelect: (question: string) => void
  disabled?: boolean
}

export function AssistantSuggestions({
  suggestions,
  onSelect,
  disabled,
}: AssistantSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="px-4 pb-3 pt-1">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
        Suggested
      </p>
      <div className="flex flex-col gap-1">
        {suggestions.map((question) => (
          <button
            key={question}
            className={cn(
              "rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-left",
              "text-[12px] text-muted-foreground transition-colors",
              "hover:border-border/70 hover:bg-muted/40 hover:text-foreground",
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
