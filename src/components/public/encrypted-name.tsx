"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { EncryptedText } from "@/components/ui/encrypted-text"
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport"
import {
  buildWorkspaceContext,
  getPresenceMessages,
  type WorkspaceContextInput,
} from "@/lib/public/presence"
import { cn } from "@/lib/utils"

type EncryptedNameProps = {
  name: string
  contextInput: WorkspaceContextInput
}

const REVEAL_DELAY_MS = 35
const DISPLAY_HOLD_MS = 2_000

export function EncryptedName({ name, contextInput }: EncryptedNameProps) {
  const isMobile = useIsMobileViewport()
  const [ready, setReady] = useState(false)
  const [displayText, setDisplayText] = useState(name)
  const [isContextual, setIsContextual] = useState(false)
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined)
  const showingNameRef = useRef(true)
  const phraseIndexRef = useRef(0)
  const measureRef = useRef<HTMLSpanElement>(null)
  const nameMeasureRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setReady(true)
  }, [])

  const phrases = useMemo(() => {
    const context = buildWorkspaceContext({ ...contextInput, now: new Date() })
    const messages = getPresenceMessages(context, "name", 8)
    const normalizedName = name.trim().toLowerCase()

    return messages.filter(
      (message) => message.trim().toLowerCase() !== normalizedName
    )
  }, [contextInput, name])

  useLayoutEffect(() => {
    const widths = [
      nameMeasureRef.current?.offsetWidth,
      measureRef.current?.offsetWidth,
    ].filter((value): value is number => typeof value === "number" && value > 0)

    if (widths.length === 0) {
      return
    }

    setMinWidth(Math.max(...widths))
  }, [name, phrases])

  useEffect(() => {
    if (!ready || isMobile || phrases.length === 0) {
      return
    }

    let timer = 0

    function scheduleNext() {
      timer = window.setTimeout(() => {
        if (showingNameRef.current) {
          const phrase = phrases[phraseIndexRef.current % phrases.length]
          phraseIndexRef.current += 1
          if (!phrase) {
            scheduleNext()
            return
          }
          setDisplayText(phrase)
          setIsContextual(true)
          showingNameRef.current = false
        } else {
          setDisplayText(name)
          setIsContextual(false)
          showingNameRef.current = true
        }

        scheduleNext()
      }, DISPLAY_HOLD_MS)
    }

    scheduleNext()

    return () => {
      window.clearTimeout(timer)
    }
  }, [name, phrases, ready, isMobile])

  const longestPhrase = phrases.reduce(
    (longest, phrase) => (phrase.length > longest.length ? phrase : longest),
    name
  )

  if (!ready || isMobile) {
    return (
      <h1 aria-label={name} className="workspace-name">
        {name}
      </h1>
    )
  }

  return (
    <h1
      aria-label={name}
      className={cn(
        "workspace-name workspace-name-animated",
        isContextual && "is-contextual"
      )}
      style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
    >
      <span className="workspace-name-measure" ref={nameMeasureRef}>
        {name}
      </span>
      <span className="workspace-name-measure" ref={measureRef}>
        {longestPhrase}
      </span>
      <span className="workspace-name-stage">
        <EncryptedText
          animateOnMount
          encryptedClassName="workspace-name-encrypted"
          flipDelayMs={REVEAL_DELAY_MS}
          key={displayText}
          revealDelayMs={REVEAL_DELAY_MS}
          revealedClassName="workspace-name-revealed"
          text={displayText}
        />
      </span>
    </h1>
  )
}
