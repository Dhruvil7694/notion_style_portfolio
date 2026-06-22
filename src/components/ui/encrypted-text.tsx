"use client"

import React, { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type EncryptedTextProps = {
  text: string
  className?: string
  revealDelayMs?: number
  charset?: string
  flipDelayMs?: number
  encryptedClassName?: string
  revealedClassName?: string
  animateOnMount?: boolean
}

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?"

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length)
  return charset.charAt(index)
}

function generateGibberishPreservingSpaces(original: string, charset: string): string {
  if (!original) {
    return ""
  }

  let result = ""
  for (let index = 0; index < original.length; index += 1) {
    const character = original[index]
    result += character === " " ? " " : generateRandomCharacter(charset)
  }
  return result
}

function RevealedText({
  className,
  revealedClassName,
  text,
}: {
  className?: string
  revealedClassName?: string
  text: string
}) {
  return (
    <span aria-label={text} className={cn(className)} role="text">
      {text.split("").map((char, index) => (
        <span className={cn(revealedClassName)} key={index}>
          {char}
        </span>
      ))}
    </span>
  )
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
  animateOnMount = false,
}) => {
  const shouldAnimate = animateOnMount

  const [hasHydrated, setHasHydrated] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [revealCount, setRevealCount] = useState(0)
  const [, setFlipTick] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastFlipTimeRef = useRef<number>(0)
  const revealCountRef = useRef(0)
  const scrambleCharsRef = useRef<string[]>([])

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated || !shouldAnimate) {
      return
    }

    const initial = text ? generateGibberishPreservingSpaces(text, charset) : ""
    scrambleCharsRef.current = initial.split("")
    startTimeRef.current = performance.now()
    lastFlipTimeRef.current = startTimeRef.current
    setRevealCount(0)
    revealCountRef.current = 0
    setIsAnimating(true)

    let isCancelled = false

    const update = (now: number) => {
      if (isCancelled) {
        return
      }

      const elapsedMs = now - startTimeRef.current
      const totalLength = text.length
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs))
      )

      if (currentRevealCount !== revealCountRef.current) {
        revealCountRef.current = currentRevealCount
        setRevealCount(currentRevealCount)
      }

      if (currentRevealCount >= totalLength) {
        return
      }

      const timeSinceLastFlip = now - lastFlipTimeRef.current
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            if (text[index] !== " ") {
              scrambleCharsRef.current[index] = generateRandomCharacter(charset)
            } else {
              scrambleCharsRef.current[index] = " "
            }
          }
        }
        lastFlipTimeRef.current = now
        setFlipTick((tick) => tick + 1)
      }

      animationFrameRef.current = requestAnimationFrame(update)
    }

    animationFrameRef.current = requestAnimationFrame(update)

    return () => {
      isCancelled = true
      setIsAnimating(false)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [hasHydrated, shouldAnimate, text, revealDelayMs, charset, flipDelayMs])

  if (!text) {
    return null
  }

  if (!hasHydrated || !isAnimating) {
    return (
      <RevealedText
        className={className}
        revealedClassName={revealedClassName}
        text={text}
      />
    )
  }

  return (
    <span aria-label={text} className={cn(className)} role="text">
      {text.split("").map((char, index) => {
        const isRevealed = index < revealCount
        const displayChar = isRevealed
          ? char
          : char === " "
            ? " "
            : (scrambleCharsRef.current[index] ?? char)

        return (
          <span
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
            key={index}
          >
            {displayChar}
          </span>
        )
      })}
    </span>
  )
}
