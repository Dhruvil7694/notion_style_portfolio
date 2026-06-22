"use client"

import { Icon } from "@iconify/react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { PublicEmptyState } from "@/components/public/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import {
  formatSkillProficiency,
  SKILL_DB_CATEGORY_LABELS,
  type SkillDetailRow,
} from "@/lib/public/skill-usage"

type StackTableProps = {
  rows: SkillDetailRow[]
}

type SortDirection = "asc" | "desc"

type SortableColumn = "name" | "category" | "dbCategory" | "proficiency"

type SortConfig = {
  column: SortableColumn
  direction: SortDirection
}

const proficiencyBadgeClass: Record<
  NonNullable<SkillDetailRow["proficiency"]>,
  string
> = {
  expert:
    "border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  proficient:
    "border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  learning:
    "border-none bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400",
}

function UsageLinks({
  emptyLabel,
  hrefFor,
  items,
  labelFor,
}: {
  emptyLabel: string
  items: Array<{ id: string }>
  hrefFor: (item: { id: string }) => string
  labelFor: (item: { id: string }) => string
}) {
  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            className="text-sm text-foreground/82 transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
            href={hrefFor(item)}
          >
            {labelFor(item)}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function StackTable({ rows }: StackTableProps) {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "name",
    direction: "asc",
  })

  const sortedRows = useMemo(() => {
    const sorted = [...rows]

    sorted.sort((left, right) => {
      let leftValue = ""
      let rightValue = ""

      switch (sortConfig.column) {
        case "name":
          leftValue = left.name
          rightValue = right.name
          break
        case "category":
          leftValue = left.category
          rightValue = right.category
          break
        case "dbCategory":
          leftValue = left.dbCategory
            ? SKILL_DB_CATEGORY_LABELS[left.dbCategory]
            : ""
          rightValue = right.dbCategory
            ? SKILL_DB_CATEGORY_LABELS[right.dbCategory]
            : ""
          break
        case "proficiency":
          leftValue = left.proficiency ?? ""
          rightValue = right.proficiency ?? ""
          break
      }

      const comparison = leftValue.localeCompare(rightValue)
      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return sorted
  }, [rows, sortConfig])

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const currentPage = safePageIndex + 1
  const pageStart = safePageIndex * pageSize
  const paginatedRows = sortedRows.slice(pageStart, pageStart + pageSize)

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages: pageCount,
    paginationItemsToDisplay: 5,
  })

  const toggleSort = (column: SortableColumn) => {
    setSortConfig((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === "asc" ? "desc" : "asc",
        }
      }

      return { column, direction: "asc" }
    })
  }

  const changePageSize = (value: string | null) => {
    if (!value) return

    setPageSize(Number(value))
    setPageIndex(0)
  }

  if (rows.length === 0) {
    return <PublicEmptyState message="Technologies will appear here once added." />
  }

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <Table className="w-full min-w-[760px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {(
                [
                  ["name", "Technology"],
                  ["category", "Category"],
                  ["dbCategory", "Type"],
                  ["proficiency", "Proficiency"],
                ] as const
              ).map(([column, label]) => {
                const direction =
                  sortConfig.column === column ? sortConfig.direction : undefined

                return (
                  <TableHead
                    className="h-12 bg-muted/20 text-[13px] font-medium tracking-[0.08em] text-muted-foreground"
                    key={column}
                  >
                    <button
                      className="flex w-full items-center justify-between gap-2 text-left font-medium transition-opacity hover:opacity-80"
                      onClick={() => toggleSort(column)}
                      type="button"
                    >
                      {label}
                      {direction === "asc" ? (
                        <ChevronUpIcon aria-hidden className="size-4 opacity-60" />
                      ) : direction === "desc" ? (
                        <ChevronDownIcon aria-hidden className="size-4 opacity-60" />
                      ) : null}
                    </button>
                  </TableHead>
                )
              })}
              <TableHead className="h-12 bg-muted/20 text-[13px] font-medium tracking-[0.08em] text-muted-foreground">
                Projects
              </TableHead>
              <TableHead className="h-12 bg-muted/20 text-[13px] font-medium tracking-[0.08em] text-muted-foreground">
                Experience
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
                <TableRow className="hover:bg-muted/10" id={row.id} key={row.id}>
                  <TableCell className="py-3.5 whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        aria-hidden
                        className="size-4 shrink-0 text-foreground/70 grayscale"
                        icon={row.icon}
                      />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">{row.category}</TableCell>
                  <TableCell className="py-3.5">
                    {row.dbCategory ? SKILL_DB_CATEGORY_LABELS[row.dbCategory] : "—"}
                  </TableCell>
                  <TableCell className="py-3.5">
                    {row.proficiency ? (
                      <Badge className={proficiencyBadgeClass[row.proficiency]}>
                        {formatSkillProficiency(row.proficiency)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[16rem] py-3.5 whitespace-normal">
                    <UsageLinks
                      emptyLabel="Not linked yet"
                      hrefFor={(item) =>
                        `/projects/${(item as SkillDetailRow["projects"][number]).slug}`
                      }
                      items={row.projects}
                      labelFor={(item) =>
                        (item as SkillDetailRow["projects"][number]).title
                      }
                    />
                  </TableCell>
                  <TableCell className="max-w-[16rem] py-3.5 whitespace-normal">
                    <UsageLinks
                      emptyLabel="Not linked yet"
                      hrefFor={(item) => `/experience/${item.id}`}
                      items={row.experience}
                      labelFor={(item) => {
                        const entry = item as SkillDetailRow["experience"][number]
                        return `${entry.role} · ${entry.company}`
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={6}>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-sm max-sm:flex-col">
        <p aria-live="polite" className="flex-1 text-sm whitespace-nowrap text-muted-foreground">
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
                  onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
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
                    setPageIndex((current) => Math.min(current + 1, pageCount - 1))
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
              id="stack-results-per-page"
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
