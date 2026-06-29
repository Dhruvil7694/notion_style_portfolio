"use client"

import { LayoutGroup, motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

import {
  AI_USAGE_TABS,
  aiUsageTabHref,
  type AiUsageTabId,
} from "@/features/admin/lib/ai-usage-tabs"

type AiUsageTabNavProps = {
  activeTab: AiUsageTabId
  queryPage?: number
}

export function AiUsageTabNav({ activeTab, queryPage }: AiUsageTabNavProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsMounted(true))
  }, [])

  return (
    <LayoutGroup>
      <nav
        aria-label="AI usage sections"
        className="border-border bg-card inline-flex items-center gap-0.5 rounded-lg border p-1"
      >
        {AI_USAGE_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 outline-none"
              href={aiUsageTabHref(tab.id, queryPage)}
              key={tab.id}
              title={tab.description}
            >
              {isActive ? (
                isMounted ? (
                  <motion.div
                    className="bg-foreground absolute inset-0 rounded-md"
                    layoutId="ai-tab-pill"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                      mass: 0.9,
                    }}
                  />
                ) : (
                  <div className="bg-foreground absolute inset-0 rounded-md" />
                )
              ) : null}

              <Icon
                aria-hidden
                className={
                  isActive
                    ? "text-background relative z-10 size-4 shrink-0"
                    : "text-muted-foreground hover:text-foreground relative z-10 size-4 shrink-0 transition-colors"
                }
              />
              <span
                className={
                  isActive
                    ? "text-background relative z-10 text-sm font-medium"
                    : "text-muted-foreground hover:text-foreground relative z-10 text-sm transition-colors"
                }
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </LayoutGroup>
  )
}
