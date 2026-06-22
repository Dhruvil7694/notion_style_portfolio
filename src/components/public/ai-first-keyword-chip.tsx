"use client"

import { useId, useRef, useState } from "react"

import { AiFirstKeywordPreviewPanel } from "@/components/public/ai-first-keyword-preview-panel"
import { useHoverPreviewDelays } from "@/components/public/hover-preview-card"
import { getAiFirstKeywordDetail } from "@/lib/public/ai-first-keyword-details"
import { cn } from "@/lib/utils"

type AiFirstKeywordChipProps = {
  label: string
  className?: string
}

export function AiFirstKeywordChip({ label, className }: AiFirstKeywordChipProps) {
  const detail = getAiFirstKeywordDetail(label)
  const [open, setOpen] = useState(false)
  const chipRef = useRef<HTMLLIElement>(null)
  const previewId = useId()
  const { scheduleClose, clearTimers } = useHoverPreviewDelays()

  if (!detail) {
    return null
  }

  const show = () => {
    clearTimers()
    setOpen(true)
  }

  const hide = () => {
    scheduleClose(() => setOpen(false))
  }

  const keepOpen = () => {
    clearTimers()
    setOpen(true)
  }

  return (
    <>
      <li
        ref={chipRef}
        aria-describedby={open ? previewId : undefined}
        className={cn("ai-first-keyword ai-first-keyword-interactive", open && "is-preview-open", className)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hide()
          }
        }}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={hide}
        tabIndex={0}
      >
        {detail.label}
      </li>

      <AiFirstKeywordPreviewPanel
        anchorRef={chipRef}
        detail={detail}
        onMouseEnter={keepOpen}
        onMouseLeave={hide}
        open={open}
        previewId={previewId}
      />
    </>
  )
}
