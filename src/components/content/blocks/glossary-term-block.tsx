"use client"

import { HoverCard } from "@/components/content/hover-card"

type GlossaryTermBlockProps = {
  term: string
  title: string
  description: string
  tags?: string[]
}

export function GlossaryTermBlock({
  term,
  title,
  description,
  tags,
}: GlossaryTermBlockProps) {
  return (
    <HoverCard trigger={term}>
      <div className="space-y-2">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{term}</p>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </HoverCard>
  )
}
