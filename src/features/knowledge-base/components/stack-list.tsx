"use client"

import { Search, X } from "lucide-react"
import { useEffect, useId, useMemo, useState } from "react"

import { StackPagination } from "@/features/knowledge-base/components/stack-pagination"
import {
  ProficiencyBadge,
  StackTechLabel,
  UsageLinks,
} from "@/features/knowledge-base/components/stack-shared"
import {
  formatSkillProficiency,
  SKILL_DB_CATEGORY_LABELS,
  type SkillDetailRow,
} from "@/features/portfolio/lib/skill-usage"
import {
  buildStackFilterOptions,
  EMPTY_STACK_FILTERS,
  filterStackRows,
  hasActiveStackFilters,
  type StackFilterState,
} from "@/features/portfolio/lib/stack-filters"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"
import {
  PublicSiteSelectContent,
  PublicSiteSelectTrigger,
  SelectItem,
} from "@/features/site-shell/components/public-site-select"
import { cn } from "@/shared/lib/utils"
import { Select, SelectValue } from "@/shared/ui/select"

type StackListProps = {
  rows: SkillDetailRow[]
}

export function StackList({ rows }: StackListProps) {
  const searchId = useId()
  const typeSelectId = useId()
  const proficiencySelectId = useId()
  const [filters, setFilters] = useState<StackFilterState>(EMPTY_STACK_FILTERS)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const options = useMemo(() => buildStackFilterOptions(rows), [rows])
  const filteredRows = useMemo(
    () => filterStackRows(rows, filters),
    [filters, rows]
  )

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const currentPage = safePageIndex + 1
  const pageStart = safePageIndex * pageSize
  const paginatedRows = filteredRows.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    setPageIndex(0)
  }, [filters, pageSize])

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0))
    }
  }, [pageCount, pageIndex])

  function updateFilters(patch: Partial<StackFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function clearFilters() {
    setFilters(EMPTY_STACK_FILTERS)
  }

  if (rows.length === 0) {
    return (
      <PublicEmptyState message="Technologies will appear here once added." />
    )
  }

  return (
    <div className="stack-list w-full space-y-4">
      <div className="stack-list-filters space-y-3 rounded-xl border border-border/60 bg-background p-3 shadow-sm">
        <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
          <Search
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            id={searchId}
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="Search technologies"
            type="search"
            value={filters.query}
          />
          {filters.query ? (
            <button
              aria-label="Clear search"
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => updateFilters({ query: "" })}
              type="button"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          ) : null}
        </label>

        <div className="stack-list-filter-chips -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filters.category === null
                ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
            )}
            onClick={() => updateFilters({ category: null })}
            type="button"
          >
            All
          </button>
          {options.categories.map((category) => (
            <button
              key={category}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filters.category === category
                  ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              )}
              onClick={() =>
                updateFilters({
                  category: filters.category === category ? null : category,
                })
              }
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            onValueChange={(value) =>
              updateFilters({
                dbCategory:
                  value === "all"
                    ? null
                    : (value as StackFilterState["dbCategory"]),
              })
            }
            value={filters.dbCategory ?? "all"}
          >
            <PublicSiteSelectTrigger
              aria-label="Filter by type"
              className="h-9 w-full text-xs"
              id={typeSelectId}
            >
              <SelectValue placeholder="Type" />
            </PublicSiteSelectTrigger>
            <PublicSiteSelectContent>
              <SelectItem value="all">All types</SelectItem>
              {options.dbCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {SKILL_DB_CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </PublicSiteSelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              updateFilters({
                proficiency:
                  value === "all"
                    ? null
                    : (value as StackFilterState["proficiency"]),
              })
            }
            value={filters.proficiency ?? "all"}
          >
            <PublicSiteSelectTrigger
              aria-label="Filter by proficiency"
              className="h-9 w-full text-xs"
              id={proficiencySelectId}
            >
              <SelectValue placeholder="Proficiency" />
            </PublicSiteSelectTrigger>
            <PublicSiteSelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {options.proficiencies.map((proficiency) => (
                <SelectItem key={proficiency} value={proficiency}>
                  {formatSkillProficiency(proficiency)}
                </SelectItem>
              ))}
            </PublicSiteSelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="text-muted-foreground">
            <span className="text-foreground">{filteredRows.length}</span> of{" "}
            <span className="text-foreground">{rows.length}</span> technologies
          </p>
          {hasActiveStackFilters(filters) ? (
            <button
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {filteredRows.length > 0 ? (
        <>
          <ul className="stack-list-items space-y-3">
            {paginatedRows.map((row) => (
              <li
                className="stack-list-item rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                id={row.id}
                key={row.id}
              >
                <div className="stack-list-item-header space-y-3">
                  <StackTechLabel row={row} />

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/60 px-2 py-0.5">
                      {row.category}
                    </span>
                    {row.dbCategory ? (
                      <span className="rounded-full border border-border/60 px-2 py-0.5">
                        {SKILL_DB_CATEGORY_LABELS[row.dbCategory]}
                      </span>
                    ) : null}
                    <ProficiencyBadge proficiency={row.proficiency} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-border/40 pt-4">
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Projects
                    </p>
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
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Experience
                    </p>
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
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <StackPagination
            currentPage={currentPage}
            mobile
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPageIndex(0)
            }}
            pageCount={pageCount}
            pageSize={pageSize}
            selectId="stack-list-results-per-page"
          />
        </>
      ) : (
        <PublicEmptyState message="No technologies match your filters." />
      )}
    </div>
  )
}
