"use client"

import { cn } from "@/lib/utils"

export type SaveState = "saved" | "saving" | "unsaved"

type EditorStatusProps = {
  state: SaveState
  error?: string | null
  className?: string
}

const STATUS_LABELS: Record<SaveState, string> = {
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
}

const STATUS_STYLES: Record<SaveState, string> = {
  saved: "text-muted-foreground",
  saving: "text-primary",
  unsaved: "text-amber-600 dark:text-amber-400",
}

export function EditorStatus({ state, error, className }: EditorStatusProps) {
  return (
    <div className={cn("flex flex-col items-end gap-0.5 text-xs", className)}>
      <span
        aria-live="polite"
        className={cn("font-medium", STATUS_STYLES[state])}
        role="status"
      >
        {STATUS_LABELS[state]}
      </span>
      {error ? (
        <span className="text-destructive max-w-xs text-right" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
