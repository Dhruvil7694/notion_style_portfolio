"use client"

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { PublicEmptyState } from "@/components/public/empty-state"
import { StackList } from "@/components/public/stack-list"
import { StackPagination } from "@/components/public/stack-pagination"
import {
  ProficiencyBadge,
  StackTechLabel,
  UsageLinks,
} from "@/components/public/stack-shared"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport"
import {
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

function StackTableDesktop({ rows }: StackTableProps) {
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
                  sortConfig.column === column
                    ? sortConfig.direction
                    : undefined

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
                <TableRow
                  className="hover:bg-muted/10"
                  id={row.id}
                  key={row.id}
                >
                  <TableCell className="py-3.5 whitespace-normal">
                    <StackTechLabel row={row} />
                  </TableCell>
                  <TableCell className="py-3.5">{row.category}</TableCell>
                  <TableCell className="py-3.5">
                    {row.dbCategory
                      ? SKILL_DB_CATEGORY_LABELS[row.dbCategory]
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <ProficiencyBadge proficiency={row.proficiency} />
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
                        const entry =
                          item as SkillDetailRow["experience"][number]
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

      <StackPagination
        currentPage={currentPage}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPageIndex(0)
        }}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </div>
  )
}

export function StackTable({ rows }: StackTableProps) {
  const isMobile = useIsMobileViewport()

  if (rows.length === 0) {
    return (
      <PublicEmptyState message="Technologies will appear here once added." />
    )
  }

  if (isMobile) {
    return <StackList rows={rows} />
  }

  return <StackTableDesktop rows={rows} />
}
