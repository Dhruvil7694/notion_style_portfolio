"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  getGazeFromPointer,
  PORTRAIT_GAZE_KEYS,
  PORTRAIT_IMAGES,
  type PortraitGaze,
  preloadPortraitImages,
} from "@/features/site-shell/lib/portrait/portrait-assets"

type InteractivePortraitProps = {
  name: string
}

export function InteractivePortrait({ name }: InteractivePortraitProps) {
  const mediaRef = useRef<HTMLDivElement>(null)
  const [gaze, setGaze] = useState<PortraitGaze>("straight")

  useEffect(() => {
    preloadPortraitImages()
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = mediaRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      const x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)
      )
      const y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)
      )

      setGaze(getGazeFromPointer(x, y))
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setGaze("straight")
  }, [])

  return (
    <div className="about-portrait-wrap">
      <div
        className="about-portrait-media"
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        ref={mediaRef}
      >
        <div className="about-portrait-stack">
          {PORTRAIT_GAZE_KEYS.map((gazeKey) => {
            const active = gaze === gazeKey

            return (
              <div
                aria-hidden={!active}
                className="about-portrait-layer"
                data-active={active ? "true" : "false"}
                key={gazeKey}
              >
                <Image
                  alt={active ? `Portrait of ${name}` : ""}
                  className="about-portrait"
                  fill
                  priority={gazeKey === "straight"}
                  sizes="(max-width: 768px) 13rem, 16rem"
                  src={PORTRAIT_IMAGES[gazeKey]}
                />
              </div>
            )
          })}
        </div>
      </div>

      <span className="sr-only">{name}</span>
    </div>
  )
}
