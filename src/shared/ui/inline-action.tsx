"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Save } from "lucide-react"
import { useState } from "react"

import { cn } from "@/shared/lib/utils"

interface InlineActionProps {
  actionText?: string
  onAction: () => Promise<void>
  className?: string
  disabled?: boolean
}

export function InlineAction({
  actionText = "Save",
  onAction,
  className,
  disabled = false,
}: InlineActionProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleTrigger = async () => {
    if (isLoading || disabled) {
      return
    }

    setIsLoading(true)
    try {
      await onAction()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "border-border/60 bg-card/80 inline-flex h-8 shrink-0 overflow-hidden rounded-lg border shadow-sm",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        {!isLoading ? (
          <motion.button
            key="idle"
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground hover:bg-muted/60 inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold transition-colors"
            exit={{ opacity: 0, x: -4 }}
            initial={{ opacity: 0, x: 4 }}
            onClick={handleTrigger}
            transition={{ duration: 0.15 }}
            type="button"
          >
            <Save aria-hidden className="size-3.5" />
            <span>{actionText}</span>
          </motion.button>
        ) : (
          <motion.div
            key="loading"
            animate={{ opacity: 1 }}
            className="inline-flex h-8 w-[4.25rem] items-center justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2
              aria-label="Saving"
              className="text-muted-foreground size-3.5 animate-spin"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
