"use client"

import { ChevronDown } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"

type AiSummaryBlockProps = {
  summary: string
}

export function AiSummaryBlock({ summary }: AiSummaryBlockProps) {
  const text = summary.trim()

  if (!text) {
    return null
  }

  return (
    <aside aria-label="AI summary">
      <Collapsible className="group knowledge-ai-summary" defaultOpen>
        <CollapsibleTrigger className="knowledge-ai-summary-trigger">
          <span className="knowledge-ai-summary-label">Summary</span>
          <ChevronDown
            aria-hidden
            className="knowledge-ai-summary-chevron size-4 shrink-0"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="knowledge-ai-summary-content overflow-hidden">
          <p className="knowledge-ai-summary-text">{text}</p>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  )
}
