"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import {
  PublicSiteSelectContent,
  PublicSiteSelectTrigger,
  SelectItem,
} from "@/components/public/public-site-select"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { Select, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { cn } from "@/lib/utils"

type StackPaginationProps = {
  currentPage: number
  pageCount: number
  pageSize: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  mobile?: boolean
  pageSizeOptions?: number[]
  selectId?: string
}

export function StackPagination({
  currentPage,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  mobile = false,
  pageSizeOptions = mobile ? [5, 10, 20] : [5, 10, 25, 50],
  selectId = "stack-results-per-page",
}: StackPaginationProps) {
  const safePageIndex = Math.min(currentPage - 1, Math.max(pageCount - 1, 0))
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages: pageCount,
    paginationItemsToDisplay: mobile ? 3 : 5,
  })

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-sm",
        mobile && "flex-col"
      )}
    >
      <p
        aria-live="polite"
        className={cn(
          "text-sm whitespace-nowrap text-muted-foreground",
          mobile ? "w-full text-center" : "flex-1"
        )}
      >
        Page <span className="text-foreground">{currentPage}</span> of{" "}
        <span className="text-foreground">{pageCount}</span>
      </p>

      <div className={cn(mobile ? "w-full" : "grow")}>
        <Pagination>
          <PaginationContent
            className={mobile ? "w-full justify-center" : undefined}
          >
            <PaginationItem>
              <Button
                aria-label="Go to previous page"
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={safePageIndex === 0}
                onClick={() => onPageChange(Math.max(safePageIndex - 1, 0))}
                size="icon"
                variant="outline"
              >
                <ChevronLeftIcon aria-hidden />
              </Button>
            </PaginationItem>

            {showLeftEllipsis ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}

            {pages.map((page) => {
              const isActive = page === currentPage

              return (
                <PaginationItem key={page}>
                  <Button
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onPageChange(page - 1)}
                    size="icon"
                    variant={isActive ? "outline" : "ghost"}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              )
            })}

            {showRightEllipsis ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}

            <PaginationItem>
              <Button
                aria-label="Go to next page"
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={safePageIndex >= pageCount - 1}
                onClick={() =>
                  onPageChange(Math.min(safePageIndex + 1, pageCount - 1))
                }
                size="icon"
                variant="outline"
              >
                <ChevronRightIcon aria-hidden />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <div className={cn("flex justify-end", mobile ? "w-full" : "flex-1")}>
        <Select
          onValueChange={(value) => {
            if (!value) return
            onPageSizeChange(Number(value))
          }}
          value={pageSize.toString()}
        >
          <PublicSiteSelectTrigger
            aria-label="Results per page"
            className={cn(
              "h-9 border-border/60 whitespace-nowrap",
              mobile ? "w-full" : "w-fit"
            )}
            id={selectId}
          >
            <SelectValue placeholder="Select number of results" />
          </PublicSiteSelectTrigger>
          <PublicSiteSelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} / page
              </SelectItem>
            ))}
          </PublicSiteSelectContent>
        </Select>
      </div>
    </div>
  )
}
