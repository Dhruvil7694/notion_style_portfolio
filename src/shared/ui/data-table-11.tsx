"use client"

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { usePagination } from "@/shared/hooks/use-pagination"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/shared/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

type Availability = "In Stock" | "Limited" | "Out of Stock"

type ProductItem = {
  availability: Availability
  id: string
  price: number
  productName: string
}

type SortDirection = "asc" | "desc"

type SortableColumn = "availability" | "price" | "productName"

type SortConfig = {
  column: SortableColumn
  direction: SortDirection
}

const data: readonly ProductItem[] = [
  {
    id: "PRD-201",
    productName: "Atlas Phone X",
    price: 699,
    availability: "In Stock",
  },
  {
    id: "PRD-202",
    productName: "North Headphones",
    price: 242,
    availability: "In Stock",
  },
  {
    id: "PRD-203",
    productName: "Pulse Tablet Air",
    price: 655,
    availability: "Limited",
  },
  {
    id: "PRD-204",
    productName: "Studio Display 24",
    price: 874,
    availability: "In Stock",
  },
  {
    id: "PRD-205",
    productName: "Mono Charging Dock",
    price: 541,
    availability: "Out of Stock",
  },
  {
    id: "PRD-206",
    productName: "Trail Smartwatch",
    price: 319,
    availability: "Limited",
  },
  {
    id: "PRD-207",
    productName: "Luma Keyboard",
    price: 189,
    availability: "In Stock",
  },
  {
    id: "PRD-208",
    productName: "Vector Camera Mini",
    price: 999,
    availability: "Out of Stock",
  },
  {
    id: "PRD-209",
    productName: "Glass Speaker One",
    price: 420,
    availability: "Limited",
  },
  {
    id: "PRD-210",
    productName: "Orbit Mouse",
    price: 129,
    availability: "In Stock",
  },
  {
    id: "PRD-211",
    productName: "Signal Router Max",
    price: 349,
    availability: "Limited",
  },
  {
    id: "PRD-212",
    productName: "Core Laptop Stand",
    price: 79,
    availability: "In Stock",
  },
] as const

const availabilityBadgeClass: Record<Availability, string> = {
  "In Stock":
    "border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  "Out of Stock":
    "border-none bg-destructive/10 text-destructive dark:bg-destructive/20",
  Limited:
    "border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
}

const formatCurrency = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)

export function DataTable11() {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "productName",
    direction: "asc",
  })

  const sortedData = useMemo(() => {
    const sorted = [...data]

    sorted.sort((left, right) => {
      const leftValue = left[sortConfig.column]
      const rightValue = right[sortConfig.column]

      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue))

      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return sorted
  }, [sortConfig])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const currentPage = safePageIndex + 1
  const pageStart = safePageIndex * pageSize
  const pageEnd = pageStart + pageSize
  const paginatedData = sortedData.slice(pageStart, pageEnd)

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages: pageCount,
    paginationItemsToDisplay: 5,
  })

  const allSelectedOnPage =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id))
  const someSelectedOnPage =
    paginatedData.some((item) => selectedIds.includes(item.id)) &&
    !allSelectedOnPage

  const toggleAllOnPage = (checked: boolean) => {
    if (checked) {
      setSelectedIds((current) =>
        Array.from(
          new Set([...current, ...paginatedData.map((item) => item.id)])
        )
      )
      return
    }

    setSelectedIds((current) =>
      current.filter((id) => !paginatedData.some((item) => item.id === id))
    )
  }

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id]
      }

      return current.filter((item) => item !== id)
    })
  }

  const toggleSort = (column: SortableColumn) => {
    setSortConfig((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === "asc" ? "desc" : "asc",
        }
      }

      return {
        column,
        direction: "asc",
      }
    })
  }

  const changePageSize = (value: string | null) => {
    if (!value) return

    setPageSize(Number(value))
    setPageIndex(0)
  }

  return (
    <div className="mx-auto w-full space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 w-10 bg-muted/20 font-medium">
                <Checkbox
                  aria-checked={
                    someSelectedOnPage ? "mixed" : allSelectedOnPage
                  }
                  aria-label="Select all products on this page"
                  checked={allSelectedOnPage}
                  className="after:hidden data-checked:border-sky-600 data-checked:bg-sky-600 data-checked:text-white dark:data-checked:border-sky-500 dark:data-checked:bg-sky-500 dark:data-checked:text-white"
                  onCheckedChange={(value) => toggleAllOnPage(!!value)}
                />
              </TableHead>

              {(
                [
                  ["productName", "Product Name"],
                  ["price", "Price"],
                  ["availability", "Availability"],
                ] as const
              ).map(([column, label]) => {
                const direction =
                  sortConfig.column === column
                    ? sortConfig.direction
                    : undefined

                return (
                  <TableHead
                    className="h-12 bg-muted/20 text-[13px] font-medium tracking-[0.08em] text-muted-foreground"
                    key={column}
                  >
                    <button
                      className={cn(
                        "flex w-full items-center justify-between gap-2 text-left font-medium transition-opacity hover:opacity-80"
                      )}
                      onClick={() => toggleSort(column)}
                      type="button"
                    >
                      {label}
                      {direction === "asc" ? (
                        <ChevronUpIcon
                          aria-hidden
                          className="size-4 opacity-60"
                        />
                      ) : direction === "desc" ? (
                        <ChevronDownIcon
                          aria-hidden
                          className="size-4 opacity-60"
                        />
                      ) : null}
                    </button>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => {
                const isSelected = selectedIds.includes(item.id)

                return (
                  <TableRow
                    className="hover:bg-muted/10 data-[state=selected]:bg-muted/20"
                    data-state={isSelected ? "selected" : undefined}
                    key={item.id}
                  >
                    <TableCell className="py-3.5">
                      <Checkbox
                        aria-label={`Select ${item.productName}`}
                        checked={isSelected}
                        className="after:hidden data-checked:border-sky-600 data-checked:bg-sky-600 data-checked:text-white dark:data-checked:border-sky-500 dark:data-checked:bg-sky-500 dark:data-checked:text-white"
                        onCheckedChange={(value) => toggleRow(item.id, !!value)}
                      />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="font-medium">{item.productName}</div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="font-medium">
                        {formatCurrency(item.price)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge
                        className={availabilityBadgeClass[item.availability]}
                      >
                        {item.availability}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={4}>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-sm max-sm:flex-col">
        <p
          aria-live="polite"
          className="flex-1 text-sm whitespace-nowrap text-muted-foreground"
        >
          Page <span className="text-foreground">{currentPage}</span> of{" "}
          <span className="text-foreground">{pageCount}</span>
        </p>

        <div className="grow">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  aria-label="Go to previous page"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  disabled={safePageIndex === 0}
                  onClick={() =>
                    setPageIndex((current) => Math.max(current - 1, 0))
                  }
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
                      onClick={() => setPageIndex(page - 1)}
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
                    setPageIndex((current) =>
                      Math.min(current + 1, pageCount - 1)
                    )
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

        <div className="flex flex-1 justify-end">
          <Select onValueChange={changePageSize} value={pageSize.toString()}>
            <SelectTrigger
              aria-label="Results per page"
              className="h-9 w-fit border-border/60 whitespace-nowrap"
              id="results-per-page"
            >
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default DataTable11
