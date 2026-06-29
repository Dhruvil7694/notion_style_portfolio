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

import { THANK_YOU_PHRASES } from "@/features/portfolio/lib/thank-you-phrases"

const PHRASES = [...THANK_YOU_PHRASES]
const CYCLE_MS = 2000

export function ThankYouDivider() {
  const [index, setIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [wordWidth, setWordWidth] = useState<number>()
  const measureRef = useRef<HTMLSpanElement>(null)

  const currentPhrase = PHRASES[index] ?? PHRASES[0]

  const longestPhrase = useMemo(
    () =>
      PHRASES.reduce(
        (longest, phrase) =>
          phrase.length > longest.length ? phrase : longest,
        PHRASES[0] ?? ""
      ),
    []
  )

  useLayoutEffect(() => {
    const element = measureRef.current
    if (!element) {
      return
    }
    setWordWidth(Math.ceil(element.getBoundingClientRect().width) + 4)
  }, [longestPhrase])

  const advance = useCallback(() => {
    setIndex((current) => (current + 1) % PHRASES.length)
    setIsAnimating(true)
  }, [])

  useEffect(() => {
    if (isAnimating || PHRASES.length <= 1) {
      return
    }

    const timeoutId = window.setTimeout(advance, CYCLE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [advance, isAnimating])

  return (
    <section aria-label="Thank you" className="thank-you-divider">
      <span aria-hidden className="thank-you-divider-measure" ref={measureRef}>
        {longestPhrase}
      </span>

      <div className="thank-you-divider-inner">
        <span aria-hidden className="thank-you-divider-line" />
        <span
          aria-live="polite"
          className="thank-you-divider-word"
          style={
            wordWidth !== undefined ? { width: `${wordWidth}px` } : undefined
          }
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
              className="thank-you-divider-text"
              exit={{ filter: "blur(2px)", opacity: 0, y: -3 }}
              initial={{ filter: "blur(2px)", opacity: 0, y: 3 }}
              key={currentPhrase}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {currentPhrase}
            </motion.span>
          </AnimatePresence>
        </span>
        <span aria-hidden className="thank-you-divider-line" />
      </div>
    </section>
  )
}
