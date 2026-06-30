import type { FaqItem } from "@/features/knowledge-base/lib/schemas"

export const PROJECT_FAQ_DETAIL_LIMIT = 5
export const PROJECT_FAQ_PAGE_SIZE = 8

export function paginateFaqItems(
  items: FaqItem[],
  page: number,
  pageSize: number
) {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    currentPage,
    items: items.slice(start, start + pageSize),
    totalItems,
    totalPages,
  }
}

export function sliceFaqItems(items: FaqItem[], limit: number) {
  return items.slice(0, limit)
}

export function buildProjectFaqPath(slug: string, page = 1) {
  return page <= 1
    ? `/projects/${slug}/faq`
    : `/projects/${slug}/faq?page=${page}`
}
