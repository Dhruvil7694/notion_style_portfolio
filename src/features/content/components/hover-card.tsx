"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"

import { cn } from "@/shared/lib/utils"

type HoverCardProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  delayMs?: number
}

export function HoverCard({
  trigger,
  children,
  className,
  delayMs = 200,
}: HoverCardProps) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardId = useId()

  const show = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => setOpen(true), delayMs)
  }, [delayMs])

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (!pinned) {
      setOpen(false)
    }
  }, [pinned])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <span className="relative inline">
      <button
        aria-describedby={open ? cardId : undefined}
        aria-expanded={open}
        className="text-primary inline cursor-pointer border-0 bg-transparent p-0 font-inherit underline decoration-dotted underline-offset-4"
        onBlur={() => {
          setPinned(false)
          setOpen(false)
        }}
        onClick={() => {
          setPinned((value) => !value)
          setOpen((value) => !value)
        }}
        onFocus={() => setOpen(true)}
        onMouseEnter={show}
        onMouseLeave={hide}
        type="button"
      >
        {trigger}
      </button>
      {open ? (
        <span
          className={cn(
            "border-border bg-popover text-popover-foreground absolute left-0 z-50 mt-2 w-72 rounded-lg border p-3 text-sm shadow-lg",
            className
          )}
          id={cardId}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={hide}
          role="tooltip"
        >
          {children}
        </span>
      ) : null}
    </span>
  )
}
