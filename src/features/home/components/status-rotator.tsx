"use client"

import { useEffect, useRef, useState } from "react"

import {
  buildWorkspaceContext,
  getPresenceMessage,
  msUntilNextBucket,
  type WorkspaceContextInput,
} from "@/features/site-shell/lib/presence"
import { cn } from "@/shared/lib/utils"

type StatusRotatorProps = {
  contextInput: WorkspaceContextInput
  className?: string
}

export function StatusRotator({ contextInput, className }: StatusRotatorProps) {
  const [message, setMessage] = useState("")
  const [visible, setVisible] = useState(true)
  const messageRef = useRef("")

  useEffect(() => {
    let fadeId: number
    let bucketTimer: number

    function applyMessage(next: string, animate: boolean) {
      if (!next) {
        messageRef.current = ""
        setMessage("")
        return
      }

      if (!animate || !messageRef.current || next === messageRef.current) {
        messageRef.current = next
        setMessage(next)
        setVisible(true)
        return
      }

      setVisible(false)
      fadeId = window.setTimeout(() => {
        messageRef.current = next
        setMessage(next)
        setVisible(true)
      }, 220)
    }

    function refresh(animate: boolean) {
      const context = buildWorkspaceContext({
        ...contextInput,
        now: new Date(),
      })
      applyMessage(getPresenceMessage(context), animate)
    }

    function scheduleBucketRefresh() {
      const context = buildWorkspaceContext({
        ...contextInput,
        now: new Date(),
      })
      bucketTimer = window.setTimeout(() => {
        refresh(true)
        scheduleBucketRefresh()
      }, msUntilNextBucket(context))
    }

    refresh(false)
    scheduleBucketRefresh()
    const minuteTimer = window.setInterval(() => refresh(true), 60_000)

    return () => {
      window.clearTimeout(fadeId)
      window.clearTimeout(bucketTimer)
      window.clearInterval(minuteTimer)
    }
  }, [contextInput])

  if (!message) {
    return null
  }

  return (
    <span
      className={cn(
        "workspace-status-pill",
        visible && "is-visible",
        className
      )}
      suppressHydrationWarning
    >
      {message}
    </span>
  )
}
