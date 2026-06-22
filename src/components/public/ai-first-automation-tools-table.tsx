"use client"

import { Icon } from "@iconify/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

import { usePagination } from "@/hooks/use-pagination"
import { AI_FIRST_AUTOMATION_TOOLS } from "@/lib/public/ai-first-content"
import { cn } from "@/lib/utils"

const DEFAULT_PAGE_SIZE = 8
const PAGE_SIZE_OPTIONS = [6, 8, 12, 24] as const

export function AiFirstAutomationToolsTable() {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)

  const pageCount = Math.max(1, Math.ceil(AI_FIRST_AUTOMATION_TOOLS.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const currentPage = safePageIndex + 1

  const pageRows = useMemo(() => {
    const start = safePageIndex * pageSize
    return AI_FIRST_AUTOMATION_TOOLS.slice(start, start + pageSize)
  }, [pageSize, safePageIndex])

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages: pageCount,
    paginationItemsToDisplay: 5,
  })

  function changePageSize(nextSize: number) {
    setPageSize(nextSize)
    setPageIndex(0)
  }

  return (
    <section aria-labelledby="ai-first-tools-heading" className="ai-first-tools-table-section">
      <header className="ai-first-tools-table-header">
        <h2 className="ai-first-tools-table-title" id="ai-first-tools-heading">
          Automation tools I use
        </h2>
        <p className="ai-first-tools-table-description">
          LLMs, agent skills, MCP servers, and custom pipelines — mapped to how I actually
          automate work.
        </p>
      </header>

      <div className="ai-first-tools-table-wrap">
        <table className="ai-first-tools-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Tool</th>
              <th scope="col">Use for</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id}>
                <td className="ai-first-tools-table-category">{row.category}</td>
                <td className="ai-first-tools-table-tool">
                  <span className="ai-first-tools-table-tool-cell">
                    <Icon aria-hidden className="ai-first-tools-table-icon" icon={row.icon} />
                    <span>{row.tool}</span>
                  </span>
                </td>
                <td>{row.useFor}</td>
                <td className="ai-first-tools-table-notes">{row.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ai-first-tools-table-pagination">
        <p aria-live="polite" className="ai-first-tools-table-page-meta">
          Showing{" "}
          <span className="ai-first-tools-table-page-meta-strong">
            {safePageIndex * pageSize + 1}–
            {Math.min((safePageIndex + 1) * pageSize, AI_FIRST_AUTOMATION_TOOLS.length)}
          </span>{" "}
          of{" "}
          <span className="ai-first-tools-table-page-meta-strong">
            {AI_FIRST_AUTOMATION_TOOLS.length}
          </span>
        </p>

        <nav aria-label="Automation tools pagination" className="ai-first-tools-table-pager">
          <button
            aria-label="Previous page"
            className="ai-first-tools-table-page-btn"
            disabled={safePageIndex === 0}
            onClick={() => setPageIndex((value) => Math.max(value - 1, 0))}
            type="button"
          >
            <ChevronLeft aria-hidden size={16} strokeWidth={2} />
          </button>

          {showLeftEllipsis ? (
            <span aria-hidden className="ai-first-tools-table-ellipsis">
              …
            </span>
          ) : null}

          {pages.map((page) => (
            <button
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "ai-first-tools-table-page-btn",
                page === currentPage && "ai-first-tools-table-page-btn-active"
              )}
              key={page}
              onClick={() => setPageIndex(page - 1)}
              type="button"
            >
              {page}
            </button>
          ))}

          {showRightEllipsis ? (
            <span aria-hidden className="ai-first-tools-table-ellipsis">
              …
            </span>
          ) : null}

          <button
            aria-label="Next page"
            className="ai-first-tools-table-page-btn"
            disabled={safePageIndex >= pageCount - 1}
            onClick={() => setPageIndex((value) => Math.min(value + 1, pageCount - 1))}
            type="button"
          >
            <ChevronRight aria-hidden size={16} strokeWidth={2} />
          </button>
        </nav>

        <label className="ai-first-tools-table-page-size">
          <span className="ai-first-tools-table-page-size-label">Per page</span>
          <select
            aria-label="Tools per page"
            className="ai-first-tools-table-page-size-select"
            onChange={(event) => changePageSize(Number(event.target.value))}
            value={pageSize}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
