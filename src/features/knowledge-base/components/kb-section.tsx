import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/shared/lib/utils"

type KbSectionProps = {
  children: React.ReactNode
  className?: string
  description?: string
  icon?: LucideIcon
  id?: string
  title?: string
}

export function KbSection({
  children,
  className,
  description,
  icon: Icon,
  id,
  title,
}: KbSectionProps) {
  return (
    <section
      className={cn("kb-section mx-auto max-w-home px-page", className)}
      id={id}
    >
      {title ? (
        <header className="kb-section-header">
          <h2 className="kb-section-title">
            {Icon ? (
              <Icon
                aria-hidden
                className="kb-section-icon"
                strokeWidth={1.75}
              />
            ) : null}
            {title}
          </h2>
          {description ? (
            <p className="kb-section-description">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

type KbEntry = {
  title: string
  href: string
  meta?: string
  description?: string
}

type KbEntryListProps = {
  items: KbEntry[]
}

export function KbEntryList({ items }: KbEntryListProps) {
  return (
    <ul className="kb-entry-list">
      {items.map((item) => (
        <li className="kb-entry" key={`${item.href}-${item.title}`}>
          <Link className="kb-entry-link group block" href={item.href}>
            <span className="kb-entry-title group-hover:text-primary">
              {item.title}
            </span>
            {item.meta ? (
              <span className="kb-entry-meta">{item.meta}</span>
            ) : null}
            {item.description ? (
              <span className="kb-entry-description">{item.description}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
