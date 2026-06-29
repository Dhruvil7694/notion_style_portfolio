"use client"

import { useEffect, useMemo, useState } from "react"

import {
  buildWorkspaceContext,
  getPresenceMessages,
  type WorkspaceContextInput,
} from "@/features/site-shell/lib/presence"
import { deferIdleTask } from "@/shared/lib/defer-idle"
import { cn } from "@/shared/lib/utils"
import { GooeyText } from "@/shared/ui/gooey-text-morphing"

type EncryptedNameProps = {
  name: string
  contextInput: WorkspaceContextInput
}

const DISPLAY_HOLD_SEC = 2
const MOBILE_QUERY = "(max-width: 767px)"

export function EncryptedName({ name, contextInput }: EncryptedNameProps) {
  const [isMobile, setIsMobile] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const updateViewport = () => setIsMobile(mediaQuery.matches)

    updateViewport()
    mediaQuery.addEventListener("change", updateViewport)

    const cancelDeferred = deferIdleTask(() => {
      updateViewport()
      if (!mediaQuery.matches) {
        setAnimationsEnabled(true)
      }
    }, 3_000)

    return () => {
      mediaQuery.removeEventListener("change", updateViewport)
      cancelDeferred()
    }
  }, [])

  const texts = useMemo(() => {
    const context = buildWorkspaceContext({ ...contextInput, now: new Date() })
    const messages = getPresenceMessages(context, "name", 8)
    const normalizedName = name.trim().toLowerCase()

    const phrases = messages.filter(
      (message) => message.trim().toLowerCase() !== normalizedName
    )

    return [name, ...phrases]
  }, [contextInput, name])

  const showAnimation = animationsEnabled && !isMobile && texts.length > 1

  return (
    <h1
      aria-label={name}
      className={cn(
        "workspace-name",
        showAnimation && "workspace-name-animated"
      )}
    >
      {showAnimation ? (
        <GooeyText
          className="workspace-name-gooey"
          cooldownTime={DISPLAY_HOLD_SEC}
          morphTime={1}
          textClassName="text-[2rem] font-bold tracking-[-0.025em] leading-[1.15]"
          texts={texts}
        />
      ) : (
        name
      )}
    </h1>
  )
}
