"use client"

import type { InlineSpan, RichText } from "@/features/content/lib/inline"
import { normalizeRichText } from "@/features/content/lib/inline"
import { cn } from "@/shared/lib/utils"

type InlineTextProps = {
  content: RichText
  className?: string
}

function renderSpan(span: InlineSpan, index: number) {
  let element: React.ReactNode = span.text

  const marks = span.marks ?? []

  if (marks.includes("code")) {
    element = (
      <code
        className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]"
        key={index}
      >
        {element}
      </code>
    )
  }

  if (marks.includes("bold")) {
    element = <strong key={index}>{element}</strong>
  }

  if (marks.includes("italic")) {
    element = <em key={index}>{element}</em>
  }

  if (marks.includes("link") && span.href) {
    element = (
      <a
        className="text-primary underline-offset-4 hover:underline"
        href={span.href}
        key={index}
        rel="noopener noreferrer"
        target="_blank"
      >
        {element}
      </a>
    )
  }

  if (
    !marks.includes("code") &&
    !marks.includes("bold") &&
    !marks.includes("italic") &&
    !marks.includes("link")
  ) {
    return <span key={index}>{element}</span>
  }

  return <span key={index}>{element}</span>
}

export function InlineText({ content, className }: InlineTextProps) {
  const spans = normalizeRichText(content)

  if (spans.length === 0) {
    return null
  }

  return <span className={cn(className)}>{spans.map(renderSpan)}</span>
}

export function richTextHasContent(content: RichText): boolean {
  return normalizeRichText(content).some((span) => span.text.trim().length > 0)
}
