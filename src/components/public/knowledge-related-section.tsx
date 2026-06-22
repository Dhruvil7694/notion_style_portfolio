import Link from "next/link"

import type { KnowledgeEntity } from "@/lib/knowledge/types"

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

export function KnowledgeRelatedSection({ title, items }: KnowledgeRelatedSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="knowledge-related">
      <h2 className="knowledge-section-title">{title}</h2>
      <ul className="knowledge-related-list">
        {items.map((item) => (
          <li className="knowledge-related-item" key={item.id}>
            <Link className="knowledge-related-link" href={toRelativePath(item.url)}>
              <span className="knowledge-related-title">{item.title}</span>
              {item.description ? (
                <span className="knowledge-related-description">{item.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
