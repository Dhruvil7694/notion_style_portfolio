"use client"

import { User } from "lucide-react"
import Image from "next/image"
import { useCallback, useRef, useState } from "react"

import { useVisitorInterest } from "@/hooks/use-visitor-interest"
import {
  buildWorkspaceContext,
  type WorkspaceContextInput,
} from "@/lib/public/presence"
import { getPersonalizedAvatarHoverMessages } from "@/lib/public/visitor-interest"

type ProfileAvatarProps = {
  avatarUrl?: string | null
  name: string
  contextInput: WorkspaceContextInput
}

export function ProfileAvatar({ avatarUrl, name, contextInput }: ProfileAvatarProps) {
  const [hovering, setHovering] = useState(false)
  const [message, setMessage] = useState("")
  const hoverSaltRef = useRef(0)
  const interest = useVisitorInterest()

  const showTag = useCallback(() => {
    const context = buildWorkspaceContext({ ...contextInput, now: new Date() })
    const variants = getPersonalizedAvatarHoverMessages(context, interest, 16)

    if (variants.length === 0) {
      setMessage("")
      setHovering(true)
      return
    }

    const nextMessage =
      variants[hoverSaltRef.current % variants.length] ?? variants[0] ?? ""
    hoverSaltRef.current += 1
    setMessage(nextMessage)
    setHovering(true)
  }, [contextInput, interest])

  const hideTag = useCallback(() => {
    setHovering(false)
  }, [])

  return (
    <div
      className="workspace-avatar-cluster"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          hideTag()
        }
      }}
      onFocus={showTag}
      onMouseEnter={showTag}
      onMouseLeave={hideTag}
      tabIndex={0}
    >
      <div className="workspace-avatar-wrap">
        {avatarUrl ? (
          <Image
            alt=""
            className="workspace-avatar"
            height={88}
            key={avatarUrl}
            src={avatarUrl}
            unoptimized
            width={88}
          />
        ) : (
          <div aria-hidden className="workspace-avatar workspace-avatar-fallback">
            <User className="workspace-avatar-icon" strokeWidth={1.5} />
          </div>
        )}
      </div>
      {hovering && message ? (
        <span className="workspace-status-pill is-visible" role="tooltip">
          {message}
        </span>
      ) : null}
      <span className="sr-only">{name}</span>
    </div>
  )
}
