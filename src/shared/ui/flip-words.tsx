"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { cn } from "@/shared/lib/utils"

type FlipWordsProps = {
  words: string[]
  duration?: number
  className?: string
  /** Extra pixels added to measured width for comfortable fit */
  widthPadding?: number
}

export function FlipWords({
  words,
  duration = 3000,
  className,
  widthPadding = 16,
}: FlipWordsProps) {
  const [currentWord, setCurrentWord] = useState(words[0] ?? "")
  const [isAnimating, setIsAnimating] = useState(false)
  const [pillWidth, setPillWidth] = useState<number>()
  const measureRef = useRef<HTMLSpanElement>(null)

  const longestWord = useMemo(
    () =>
      words.reduce(
        (longest, word) => (word.length > longest.length ? word : longest),
        words[0] ?? ""
      ),
    [words]
  )

  const startAnimation = useCallback(() => {
    const currentIndex = words.indexOf(currentWord)
    const nextWord = words[currentIndex + 1] ?? words[0]
    if (!nextWord) {
      return
    }
    setCurrentWord(nextWord)
    setIsAnimating(true)
  }, [currentWord, words])

  useLayoutEffect(() => {
    const element = measureRef.current
    if (!element) {
      return
    }
    setPillWidth(
      Math.ceil(element.getBoundingClientRect().width) + widthPadding
    )
  }, [longestWord, className, widthPadding])

  useEffect(() => {
    if (isAnimating || words.length <= 1) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      startAnimation()
    }, duration)

    return () => window.clearTimeout(timeoutId)
  }, [duration, isAnimating, startAnimation, words.length])

  if (words.length === 0) {
    return null
  }

  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none fixed top-0 -left-[9999px] whitespace-nowrap opacity-0",
          className
        )}
        ref={measureRef}
      >
        {longestWord}
      </span>

      <span
        className={cn(
          "flip-words inline-flex items-center justify-center",
          className
        )}
        style={{ width: pillWidth !== undefined ? `${pillWidth}px` : "auto" }}
      >
        <AnimatePresence
          initial={false}
          mode="wait"
          onExitComplete={() => {
            setIsAnimating(false)
          }}
        >
          <motion.span
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="whitespace-nowrap text-center font-bold"
            exit={{ filter: "blur(2px)", opacity: 0, y: -4 }}
            initial={{ filter: "blur(2px)", opacity: 0, y: 4 }}
            key={currentWord}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {currentWord}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}
