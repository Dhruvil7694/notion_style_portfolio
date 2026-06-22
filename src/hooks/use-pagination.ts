type UsePaginationOptions = {
  currentPage: number
  totalPages: number
  paginationItemsToDisplay?: number
}

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: UsePaginationOptions) {
  const safeTotalPages = Math.max(1, totalPages)
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages)

  const half = Math.floor(paginationItemsToDisplay / 2)
  let start = Math.max(1, safeCurrentPage - half)
  const end = Math.min(safeTotalPages, start + paginationItemsToDisplay - 1)

  if (end - start + 1 < paginationItemsToDisplay) {
    start = Math.max(1, end - paginationItemsToDisplay + 1)
  }

  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return {
    pages,
    showLeftEllipsis: start > 1,
    showRightEllipsis: end < safeTotalPages,
  }
}
