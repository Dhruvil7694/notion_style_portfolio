"use client"

import { ChevronDown } from "lucide-react"
import { motion, MotionConfig, type Transition } from "motion/react"
import { type ReactNode, useEffect, useState } from "react"
import useMeasure from "react-use-measure"

import { cn } from "@/shared/lib/utils"

export type CardSplitAccordionItem = {
  content: ReactNode
  icon?: ReactNode
  id: string | number
  title: string
}

type CardSplitAccordionProps = {
  className?: string
  items: CardSplitAccordionItem[]
}

type AccordionItemProps = {
  index: number
  item: CardSplitAccordionItem
  openIndex: number
  setOpenId: (id: string | number | null) => void
  total: number
}

const springTransition: Transition = {
  damping: 50,
  mass: 1,
  stiffness: 600,
  type: "spring",
}

function AccordionItem({
  item,
  setOpenId,
  index,
  total,
  openIndex,
}: AccordionItemProps) {
  const [ref, bounds] = useMeasure()
  const isOpen = index === openIndex

  const isFirst = index === 0
  const isLast = index === total - 1
  const isBeforeOpen = index === openIndex - 1
  const isAfterOpen = index === openIndex + 1
  const isAlone = (isAfterOpen && isLast) || (isBeforeOpen && isFirst)

  const borderTopWidth = isFirst || isAfterOpen || isOpen ? "1px" : "0px"
  const borderBottomWidth = isLast || isBeforeOpen || isOpen ? "1px" : "0px"

  let borderTopLeftRadius: number | string = 0
  let borderTopRightRadius: number | string = 0
  let borderBottomLeftRadius: number | string = 0
  let borderBottomRightRadius: number | string = 0

  const radius = "var(--radius)"

  if (isOpen || isAlone) {
    borderTopLeftRadius = radius
    borderTopRightRadius = radius
    borderBottomLeftRadius = radius
    borderBottomRightRadius = radius
  } else if (isBeforeOpen) {
    borderBottomLeftRadius = radius
    borderBottomRightRadius = radius
  } else if (isAfterOpen) {
    borderTopLeftRadius = radius
    borderTopRightRadius = radius
  } else if (isFirst) {
    borderTopLeftRadius = radius
    borderTopRightRadius = radius
  } else if (isLast) {
    borderBottomLeftRadius = radius
    borderBottomRightRadius = radius
  }

  return (
    <MotionConfig transition={springTransition}>
      <motion.li layout>
        <motion.div
          animate={{
            borderBottomLeftRadius,
            borderBottomRightRadius,
            borderTopLeftRadius,
            borderTopRightRadius,
          }}
          className="border-border bg-card overflow-hidden border-solid will-change-transform"
          style={{
            borderBottomWidth,
            borderLeftWidth: "1px",
            borderRightWidth: "1px",
            borderStyle: "solid",
            borderTopWidth,
            marginBlock: isOpen ? "10px" : "0px",
          }}
        >
          <button
            className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left"
            onClick={() => setOpenId(isOpen ? null : item.id)}
            type="button"
          >
            <div className="text-card-foreground flex min-w-0 items-center gap-3">
              {item.icon ? (
                <span className="text-muted-foreground shrink-0">
                  {item.icon}
                </span>
              ) : null}
              <span className="text-card-foreground text-sm font-semibold leading-snug md:text-base">
                {item.title}
              </span>
            </div>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="shrink-0"
            >
              <ChevronDown className="text-muted-foreground size-4 md:size-5" />
            </motion.div>
          </button>

          <motion.div
            animate={{
              height: isOpen ? bounds.height : 0,
              opacity: isOpen ? 1 : 0,
            }}
            className="overflow-hidden will-change-transform"
            initial={false}
          >
            <div ref={ref}>
              <div className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed md:px-5 md:pb-5 md:text-base">
                {item.content}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.li>
    </MotionConfig>
  )
}

export function CardSplitAccordion({
  items,
  className,
}: CardSplitAccordionProps) {
  const [openId, setOpenId] = useState<string | number | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  if (items.length === 0) {
    return null
  }

  const openIndex = items.findIndex((item) => item.id === openId)

  return (
    <div className={cn("w-full", className)}>
      <ul className="m-0 w-full list-none p-0">
        {items.map((item, index) =>
          reduceMotion ? (
            <li
              className="border-border bg-card mb-2 overflow-hidden rounded-[var(--radius)] border"
              key={item.id}
            >
              <button
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                type="button"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {item.icon ? (
                    <span className="text-muted-foreground shrink-0">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold md:text-base">
                    {item.title}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "text-muted-foreground size-4 transition-transform md:size-5",
                    openId === item.id && "rotate-180"
                  )}
                />
              </button>
              {openId === item.id ? (
                <div className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed md:px-5 md:pb-5 md:text-base">
                  {item.content}
                </div>
              ) : null}
            </li>
          ) : (
            <AccordionItem
              index={index}
              item={item}
              key={item.id}
              openIndex={openIndex}
              setOpenId={setOpenId}
              total={items.length}
            />
          )
        )}
      </ul>
    </div>
  )
}
