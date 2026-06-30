import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { buildProjectFaqPath } from "@/features/knowledge-base/lib/faq-pagination"
import { cn } from "@/shared/lib/utils"

type FaqPaginationProps = {
  currentPage: number
  projectSlug: string
  totalPages: number
}

function PaginationButton({
  children,
  className,
  disabled,
  href,
  label,
}: {
  children: ReactNode
  className?: string
  disabled?: boolean
  href?: string
  label: string
}) {
  if (disabled || !href) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className={cn(
          "knowledge-faq-pagination-button",
          "knowledge-faq-pagination-button-disabled",
          className
        )}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      aria-label={label}
      className={cn("knowledge-faq-pagination-button", className)}
      href={href}
    >
      {children}
    </Link>
  )
}

export function FaqPagination({
  currentPage,
  projectSlug,
  totalPages,
}: FaqPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="FAQ pagination" className="knowledge-faq-pagination-bar">
      <PaginationButton
        disabled={currentPage <= 1}
        href={
          currentPage <= 1
            ? undefined
            : buildProjectFaqPath(projectSlug, currentPage - 1)
        }
        label="Previous page"
      >
        <ChevronLeft aria-hidden size={18} strokeWidth={1.75} />
      </PaginationButton>

      <ol className="knowledge-faq-pagination-pages">
        {pages.map((page) => {
          const isActive = page === currentPage

          return (
            <li key={page}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "knowledge-faq-pagination-page",
                  isActive && "knowledge-faq-pagination-page-active"
                )}
                href={buildProjectFaqPath(projectSlug, page)}
              >
                {page}
              </Link>
            </li>
          )
        })}
      </ol>

      <PaginationButton
        disabled={currentPage >= totalPages}
        href={
          currentPage >= totalPages
            ? undefined
            : buildProjectFaqPath(projectSlug, currentPage + 1)
        }
        label="Next page"
      >
        <ChevronRight aria-hidden size={18} strokeWidth={1.75} />
      </PaginationButton>
    </nav>
  )
}
