"use client"

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type BlockControlsProps = {
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  className?: string
}

export function BlockControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  className,
}: BlockControlsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        aria-label="Move block up"
        disabled={index === 0}
        onClick={onMoveUp}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <ChevronUp />
      </Button>
      <Button
        aria-label="Move block down"
        disabled={index >= total - 1}
        onClick={onMoveDown}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <ChevronDown />
      </Button>
      <Button
        aria-label="Remove block"
        onClick={onRemove}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <Trash2 />
      </Button>
    </div>
  )
}
