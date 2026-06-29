"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"

interface GooeyTextProps {
  texts: string[]
  morphTime?: number
  cooldownTime?: number
  className?: string
  textClassName?: string
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName,
}: GooeyTextProps) {
  const filterId = React.useId().replace(/:/g, "")
  const text1Ref = React.useRef<HTMLSpanElement>(null)
  const text2Ref = React.useRef<HTMLSpanElement>(null)

  const longestText = React.useMemo(
    () =>
      texts.reduce(
        (longest, text) => (text.length > longest.length ? text : longest),
        texts[0] ?? ""
      ),
    [texts]
  )

  React.useEffect(() => {
    if (texts.length === 0) {
      return
    }

    let textIndex = texts.length - 1
    let time = new Date()
    let morph = 0
    let cooldown = cooldownTime
    let animationFrameId = 0

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
        text2Ref.current.style.opacity = `${fraction ** 0.4 * 100}%`

        fraction = 1 - fraction
        text1Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
        text1Ref.current.style.opacity = `${fraction ** 0.4 * 100}%`
      }
    }

    const doCooldown = () => {
      morph = 0
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = ""
        text2Ref.current.style.opacity = "100%"
        text1Ref.current.style.filter = ""
        text1Ref.current.style.opacity = "0%"
      }
    }

    const doMorph = () => {
      morph -= cooldown
      cooldown = 0
      let fraction = morph / morphTime

      if (fraction > 1) {
        cooldown = cooldownTime
        fraction = 1
      }

      setMorph(fraction)
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      const newTime = new Date()
      const shouldIncrementIndex = cooldown > 0
      const dt = (newTime.getTime() - time.getTime()) / 1000
      time = newTime

      cooldown -= dt

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length] ?? ""
            text2Ref.current.textContent =
              texts[(textIndex + 1) % texts.length] ?? ""
          }
        }
        doMorph()
      } else {
        doCooldown()
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [texts, morphTime, cooldownTime])

  if (texts.length === 0) {
    return null
  }

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="relative inline-flex items-center justify-center"
        style={{ filter: `url(#${filterId})` }}
      >
        <span
          aria-hidden
          className={cn(
            "invisible whitespace-nowrap text-foreground",
            textClassName
          )}
        >
          {longestText}
        </span>
        <span
          ref={text1Ref}
          className={cn(
            "absolute inset-0 inline-flex items-center select-none whitespace-nowrap text-foreground",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inset-0 inline-flex items-center select-none whitespace-nowrap text-foreground",
            textClassName
          )}
        />
      </div>
    </div>
  )
}
