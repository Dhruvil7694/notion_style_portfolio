import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type AdminPaginationProps = {
  page: number
  totalPages: number
  totalCount: number
  basePath: string
  paramName: string
  itemLabel?: string
  className?: string
}

function buildPageHref(
  basePath: string,
  paramName: string,
  page: number,
  currentSearchParams?: Record<string, string>
): string {
  const params = new URLSearchParams(currentSearchParams ?? {})
  if (page <= 1) {
    params.delete(paramName)
  } else {
    params.set(paramName, String(page))
  }
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

type AdminPaginationWithParamsProps = AdminPaginationProps & {
  searchParams?: Record<string, string>
}

export function AdminPagination({
  page,
  totalPages,
  totalCount,
  basePath,
  paramName,
  itemLabel = "items",
  className,
  searchParams,
}: AdminPaginationWithParamsProps) {
  if (totalCount === 0) return null

  const prevHref = buildPageHref(basePath, paramName, page - 1, searchParams)
  const nextHref = buildPageHref(basePath, paramName, page + 1, searchParams)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 pt-2",
        className
      )}
    >
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages} · {totalCount} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <span
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "pointer-events-none opacity-40"
            )}
          >
            <ChevronLeft aria-hidden className="size-4" />
            Previous
          </span>
        ) : (
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "inline-flex items-center gap-1"
            )}
            href={prevHref}
          >
            <ChevronLeft aria-hidden className="size-4" />
            Previous
          </Link>
        )}
        {totalPages === 0 || page >= totalPages ? (
          <span
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "pointer-events-none opacity-40"
            )}
          >
            Next
            <ChevronRight aria-hidden className="size-4" />
          </span>
        ) : (
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "inline-flex items-center gap-1"
            )}
            href={nextHref}
          >
            Next
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

export { buildPageHref }
