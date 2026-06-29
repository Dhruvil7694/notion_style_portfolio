import Link from "next/link"

import { PublicEmptyState } from "@/features/site-shell/components/empty-state"
import { PageBreadcrumbs } from "@/features/site-shell/components/page-breadcrumbs"
import { cn } from "@/shared/lib/utils"

type PageShellProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function PageShell({
  title,
  description,
  children,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "kb-page mx-auto max-w-home px-page pb-kb-section",
        className
      )}
    >
      <header className="mb-kb-heading">
        <PageBreadcrumbs currentLabel={title} />
        <h1 className="kb-page-title">{title}</h1>
        {description ? (
          <p className="kb-page-description mt-3">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  )
}

type ContentArticleProps = {
  title: string
  excerpt?: string | null
  meta?: React.ReactNode
  beforeContent?: React.ReactNode
  afterContent?: React.ReactNode
  children: React.ReactNode
}

export function ContentArticle({
  title,
  excerpt,
  meta,
  beforeContent,
  afterContent,
  children,
}: ContentArticleProps) {
  return (
    <article className="kb-page mx-auto max-w-content px-page pb-kb-section">
      <header className="mb-kb-heading border-b border-border pb-6">
        <PageBreadcrumbs currentLabel={title} />
        {meta ? <div className="kb-entry-meta mb-3">{meta}</div> : null}
        <h1 className="kb-page-title">{title}</h1>
        {excerpt ? <p className="kb-page-description mt-3">{excerpt}</p> : null}
      </header>
      {beforeContent ? (
        <div className="content-knowledge-before mb-8">{beforeContent}</div>
      ) : null}
      <div className="article-content">{children}</div>
      {afterContent ? (
        <div className="content-knowledge-after mt-10">{afterContent}</div>
      ) : null}
    </article>
  )
}

type ContentListItem = {
  slug: string
  title: string
  excerpt?: string | null
  href: string
  meta?: string
}

type ContentListProps = {
  items: ContentListItem[]
  emptyMessage: string
}

export function ContentList({ items, emptyMessage }: ContentListProps) {
  if (items.length === 0) {
    return <PublicEmptyState message={emptyMessage} />
  }

  return (
    <ul className="kb-entry-list">
      {items.map((item) => (
        <li className="kb-entry" key={item.slug}>
          <Link className="kb-entry-link group block" href={item.href}>
            <span className="kb-entry-title group-hover:text-primary">
              {item.title}
            </span>
            {item.meta ? (
              <span className="kb-entry-meta">{item.meta}</span>
            ) : null}
            {item.excerpt ? (
              <span className="kb-entry-description">{item.excerpt}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
