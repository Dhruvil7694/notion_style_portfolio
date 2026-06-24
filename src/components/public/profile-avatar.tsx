"use client"

import { User } from "lucide-react"
import type { StaticImageData } from "next/image"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import { useVisitorInterest } from "@/hooks/use-visitor-interest"
import {
  buildWorkspaceContext,
  type WorkspaceContextInput,
} from "@/lib/public/presence"
import { DEFAULT_PROFILE_AVATAR } from "@/lib/public/settings"
import { getPersonalizedAvatarHoverMessages } from "@/lib/public/visitor-interest"

type ProfileAvatarProps = {
  avatarSrc: string | StaticImageData
  name: string
  contextInput: WorkspaceContextInput
}

function isStaticImageData(
  value: string | StaticImageData
): value is StaticImageData {
  return typeof value === "object" && value !== null && "src" in value
}

export function ProfileAvatar({
  avatarSrc,
  name,
  contextInput,
}: ProfileAvatarProps) {
  const [hovering, setHovering] = useState(false)
  const [message, setMessage] = useState("")
  const [imageError, setImageError] = useState(false)
  const [src, setSrc] = useState<string | StaticImageData>(avatarSrc)
  const hoverSaltRef = useRef(0)
  const interest = useVisitorInterest()

  useEffect(() => {
    setSrc(avatarSrc)
    setImageError(false)
  }, [avatarSrc])

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

  function handleImageError() {
    const currentSrc = isStaticImageData(src) ? src.src : src
    const fallbackSrc = DEFAULT_PROFILE_AVATAR.src

    if (currentSrc !== fallbackSrc) {
      setSrc(DEFAULT_PROFILE_AVATAR)
      return
    }

    setImageError(true)
  }

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
        {!imageError ? (
          <Image
            alt={`${name} profile photo`}
            className="workspace-avatar"
            height={88}
            key={isStaticImageData(src) ? src.src : src}
            onError={handleImageError}
            priority
            src={src}
            unoptimized={!isStaticImageData(src)}
            width={88}
          />
        ) : (
          <div
            aria-hidden
            className="workspace-avatar workspace-avatar-fallback"
          >
            <User className="workspace-avatar-icon" strokeWidth={1.5} />
          </div>
        )}
      </div>
      {hovering && message ? (
        <span className="workspace-status-pill is-visible" role="tooltip">
          {message}
        </span>
      ) : null}
    </div>
  )
}
