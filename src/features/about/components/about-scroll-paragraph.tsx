"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

type AboutScrollParagraphProps = {
  children: React.ReactNode
  /** First paragraph stays sharp on load */
  lead?: boolean
}

export function AboutScrollParagraph({
  children,
  lead = false,
}: AboutScrollParagraphProps) {
  const ref = useRef<HTMLParagraphElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.5"],
  })

  const blur = useTransform(scrollYProgress, [0, 1], lead ? [0, 0] : [6, 0])
  const filter = useTransform(blur, (value) => `blur(${value}px)`)

  return (
    <motion.p className="about-paragraph" ref={ref} style={{ filter }}>
      {children}
    </motion.p>
  )
}
