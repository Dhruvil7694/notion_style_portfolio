"use client"

import { ArrowUp, Square } from "lucide-react"
import { useEffect, useRef } from "react"

import { cn } from "@/shared/lib/utils"

type AssistantInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export function AssistantInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  isLoading = false,
  placeholder = "Ask me anything",
}: AssistantInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // auto-resize
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSubmit()
    }
  }

  const canSubmit = Boolean(value.trim()) && !disabled

  return (
    <div className="assistant-input-wrap px-3 pb-3 pt-2">
      <div
        className={cn(
          "flex items-end gap-1 rounded-2xl border bg-muted/20 px-3 py-2.5 transition-colors",
          "border-border/50 focus-within:border-border/80 focus-within:bg-background"
        )}
      >
        <textarea
          ref={textareaRef}
          className={cn(
            "flex-1 resize-none bg-transparent text-[13px] text-foreground",
            "placeholder:text-muted-foreground/40 focus:outline-none",
            "min-h-[22px] max-h-[120px] leading-[1.5]",
            "disabled:opacity-50"
          )}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          value={value}
        />

        <div className="flex shrink-0 items-center gap-1 pb-0.5">
          {isLoading ? (
            <button
              aria-label="Stop"
              className="flex size-7 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted/40"
              onClick={onStop}
              type="button"
            >
              <Square className="size-3 fill-current" />
            </button>
          ) : (
            <button
              aria-label="Send message"
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition-all",
                canSubmit
                  ? "bg-foreground text-background hover:opacity-80"
                  : "bg-muted/40 text-muted-foreground/30 cursor-not-allowed"
              )}
              disabled={!canSubmit}
              onClick={onSubmit}
              type="button"
            >
              <ArrowUp className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
