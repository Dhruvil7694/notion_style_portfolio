"use client"

import { motion, useReducedMotion } from "framer-motion"

type SectionRevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  id?: string
}

export function SectionReveal({
  children,
  className,
  delay = 0,
  id,
}: SectionRevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <section className={className} id={id}>
        {children}
      </section>
    )
  }

  return (
    <motion.section
      className={className}
      id={id}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: "-40px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.section>
  )
}
