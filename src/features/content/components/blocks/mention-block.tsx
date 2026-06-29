"use client"

import { HoverCard } from "@/features/content/components/hover-card"

type MentionBlockProps = {
  label: string
  href?: string
  description?: string
}

export function MentionBlock({ label, href, description }: MentionBlockProps) {
  const trigger = (
    <span className="bg-primary/10 text-primary rounded px-1 py-0.5 font-medium">
      @{label}
    </span>
  )

  if (!description && !href) {
    return trigger
  }

  return (
    <HoverCard trigger={trigger}>
      <div className="space-y-2">
        <p className="font-medium">{label}</p>
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
        {href ? (
          <a
            className="text-primary text-xs underline-offset-4 hover:underline"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open link
          </a>
        ) : null}
      </div>
    </HoverCard>
  )
}
