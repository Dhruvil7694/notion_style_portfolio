"use client"

import { AnimatePresence, motion, type MotionProps } from "motion/react"
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from "react"

import { cn } from "@/shared/lib/utils/index"

type AnimatedListMode = "stack" | "sequential" | "instant"

export function AnimatedListItem({
  children,
  index = 0,
  staggerDelay = 0.08,
}: {
  children: React.ReactNode
  index?: number
  staggerDelay?: number
}) {
  const animations: MotionProps = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 40,
      delay: index * staggerDelay,
    },
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode
  delay?: number
  /**
   * stack — Magic UI demo (items stack from bottom, reversed order)
   * sequential — reveal top-to-bottom in source order (chat history)
   * instant — all items with staggered entry delay
   */
  mode?: AnimatedListMode
}

export const AnimatedList = React.memo(
  ({
    children,
    className,
    delay = 1000,
    mode = "stack",
    ...props
  }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    )

    useEffect(() => {
      setIndex(0)
    }, [childrenArray.length, mode])

    useEffect(() => {
      if (mode === "instant") return

      let timeout: ReturnType<typeof setTimeout> | null = null

      if (index < childrenArray.length - 1) {
        timeout = setTimeout(() => {
          setIndex((prevIndex) => prevIndex + 1)
        }, delay)
      }

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout)
        }
      }
    }, [index, delay, childrenArray.length, mode])

    const itemsToShow = useMemo(() => {
      if (mode === "instant") return childrenArray
      if (mode === "sequential") {
        return childrenArray.slice(0, index + 1)
      }
      return childrenArray.slice(0, index + 1).reverse()
    }, [index, childrenArray, mode])

    const staggerDelay = delay / 1000

    return (
      <div
        className={cn(
          "flex flex-col",
          mode === "stack" ? "items-center gap-4" : "items-stretch gap-1",
          className
        )}
        {...props}
      >
        <AnimatePresence initial={false}>
          {itemsToShow.map((item, itemIndex) => (
            <AnimatedListItem
              key={(item as React.ReactElement).key}
              index={mode === "instant" ? itemIndex : 0}
              staggerDelay={mode === "instant" ? staggerDelay : 0}
            >
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedList.displayName = "AnimatedList"
