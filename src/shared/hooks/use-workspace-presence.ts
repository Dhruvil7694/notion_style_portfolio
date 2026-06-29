"use client"

import { useEffect, useMemo, useState } from "react"

import {
  buildWorkspaceContext,
  getAvatarPresence,
  getPresenceMessage,
  getTimeBlockPresence,
  msUntilNextBucket,
  type WorkspaceContextInput,
} from "@/features/site-shell/lib/presence"

export function useWorkspacePresence(input: WorkspaceContextInput) {
  const [tick, setTick] = useState(0)

  const context = useMemo(
    () => buildWorkspaceContext({ ...input, now: new Date() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives IST refresh
    [input.site, input.contact, tick]
  )

  useEffect(() => {
    const current = buildWorkspaceContext({ ...input, now: new Date() })
    const bucketMs = msUntilNextBucket(current)
    const intervalMs = Math.min(bucketMs, 60_000)

    const id = window.setInterval(() => {
      setTick((value) => value + 1)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [input])

  return {
    context,
    message: getPresenceMessage(context),
    timeBlock: getTimeBlockPresence(context),
    avatar: getAvatarPresence(context),
  }
}
