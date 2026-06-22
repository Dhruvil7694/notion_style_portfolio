"use client"

import { InlineText, richTextHasContent } from "@/components/content/inline-text"
import type { RichText } from "@/lib/content/inline"
import type { CalloutVariant } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

const VARIANT_STYLES: Record<CalloutVariant, string> = {
  info: "border-border bg-muted/40",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  danger: "border-destructive/30 bg-destructive/5",
}

const VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
}

type CalloutBlockProps = {
  variant: CalloutVariant
  content: RichText
}

export function CalloutBlock({ variant, content }: CalloutBlockProps) {
  if (!richTextHasContent(content)) {
    return null
  }

  return (
    <aside
      aria-label={`${VARIANT_LABELS[variant]} callout`}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm leading-6",
        VARIANT_STYLES[variant]
      )}
    >
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {VARIANT_LABELS[variant]}
      </p>
      <InlineText content={content} />
    </aside>
  )
}
