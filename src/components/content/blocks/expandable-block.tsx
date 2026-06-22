"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useState } from "react"

import { BlockRenderer } from "@/components/content/block-renderer"
import type { ContentBlock } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

type ExpandableBlockProps = {
  title: string
  content: ContentBlock[]
  projectPreviews?: Record<string, ProjectPreview>
}

type ProjectPreview = {
  id: string
  title: string
  summary: string
  tech_stack: string[] | null
  status: string
}

export function ExpandableBlock({
  title,
  content,
  projectPreviews,
}: ExpandableBlockProps) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()

  return (
    <div className="border-border rounded-lg border">
      <button
        aria-expanded={open}
        className="hover:bg-muted/40 flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden className={cn("transition-transform", open && "rotate-90")}>
          ▶
        </span>
        {title}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: "easeOut" }}
          >
            <div className="border-border space-y-4 border-t px-4 py-4">
              <BlockRenderer blocks={content} projectPreviews={projectPreviews} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
