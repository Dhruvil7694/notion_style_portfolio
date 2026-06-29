"use client"

import { useEffect, useState } from "react"

import {
  buildWorkspaceContext,
  getPresenceMessage,
  type WorkspaceContextInput,
} from "@/features/site-shell/lib/presence"
import { cn } from "@/shared/lib/utils"

type LiveStatusBubbleProps = {
  contextInput: WorkspaceContextInput
  className?: string
}

/** @deprecated Use StatusRotator with Presence Engine instead. */
export function LiveStatusBubble({
  contextInput,
  className,
}: LiveStatusBubbleProps) {
  const [message, setMessage] = useState("")

  useEffect(() => {
    function updateMessage() {
      setMessage(
        getPresenceMessage(
          buildWorkspaceContext({ ...contextInput, now: new Date() })
        )
      )
    }

    updateMessage()
    const interval = window.setInterval(updateMessage, 60_000)
    return () => window.clearInterval(interval)
  }, [contextInput])

  return (
    <span
      className={cn(
        "workspace-status workspace-status-popover is-visible",
        className
      )}
      suppressHydrationWarning
    >
      {message || "\u00A0"}
    </span>
  )
}
