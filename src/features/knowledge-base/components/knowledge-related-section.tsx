import Link from "next/link"

import type { KnowledgeEntity } from "@/features/knowledge-base/lib/types"

type KnowledgeRelatedSectionProps = {
  title: string
  items: KnowledgeEntity[]
}

function toRelativePath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url.startsWith("/") ? url : `/${url}`
  }
}

export function KnowledgeRelatedSection({
  title,
  items,
}: KnowledgeRelatedSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="knowledge-related">
      <h2 className="knowledge-section-title">{title}</h2>
      <ul className="knowledge-related-pills">
        {items.map((item) => (
          <li className="knowledge-related-pill-item" key={item.id}>
            <Link
              className="knowledge-related-pill"
              href={toRelativePath(item.url)}
              title={item.description ?? undefined}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
