"use client"

import { Download } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { AdminDataTable } from "@/features/admin/components/admin-panel"
import type {
  SeoAuditResult,
  SeoAuditScore,
  SeoHealthBand,
  SeoItemType,
} from "@/features/seo/lib/audit/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import { SeoAuditDrawer } from "./seo-audit-drawer"

const PAGE_SIZE = 20

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs tabular-nums">
        {score}
      </span>
    </div>
  )
}

function BandBadge({ band }: { band: SeoHealthBand }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        band === "healthy" &&
          "bg-green-500/15 text-green-600 dark:text-green-400",
        band === "warning" &&
          "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        band === "critical" && "bg-red-500/15 text-red-600 dark:text-red-400"
      )}
    >
      {band.charAt(0).toUpperCase() + band.slice(1)}
    </span>
  )
}

function exportCsv(items: SeoAuditScore[]) {
  const header = "Title,Type,Score,Band,Issues,SEO Title,SEO Description"
  const rows = items.map((i) => {
    const seoTitle =
      i.checks.find((c) => c.ruleId === "seo_title_length")?.currentValue ?? ""
    const seoDesc =
      i.checks.find((c) => c.ruleId === "seo_desc_length")?.currentValue ?? ""
    return [
      `"${i.title.replace(/"/g, '""')}"`,
      i.type,
      i.score,
      i.band,
      i.issueCount,
      `"${seoTitle.replace(/"/g, '""')}"`,
      `"${seoDesc.replace(/"/g, '""')}"`,
    ].join(",")
  })
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `seo-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const SELECT_CLASS =
  "rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"

type Props = { result: SeoAuditResult; highlightId?: string }

export function SeoAuditPanel({ result, highlightId }: Props) {
  const [typeFilter, setTypeFilter] = useState<SeoItemType | "all">("all")
  const [bandFilter, setBandFilter] = useState<SeoHealthBand | "all">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [recentlyFixed, setRecentlyFixed] = useState<Set<string>>(new Set())

  function handleApplied(id: string) {
    setRecentlyFixed((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setRecentlyFixed((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 5000)
  }

  useEffect(() => {
    if (!highlightId) return
    const match = result.items.find((i) => i.id === highlightId)
    if (match) {
      setSelectedId(match.id)
      setDrawerOpen(true)
    }
  }, [highlightId, result.items])

  const selected = selectedId
    ? (result.items.find((i) => i.id === selectedId) ?? null)
    : null

  const filtered = useMemo(() => {
    return result.items.filter((i) => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false
      if (bandFilter !== "all" && i.band !== bandFilter) return false
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()))
        return false
      return true
    })
  }, [result.items, typeFilter, bandFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openItem(item: SeoAuditScore) {
    setSelectedId(item.id)
    setDrawerOpen(true)
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={SELECT_CLASS}
          onChange={(e) => {
            setTypeFilter(e.target.value as SeoItemType | "all")
            setPage(1)
          }}
          value={typeFilter}
        >
          <option value="all">All types</option>
          <option value="project">Projects</option>
          <option value="blog">Blog</option>
          <option value="research">Research</option>
          <option value="automation">Automations</option>
        </select>

        <select
          className={SELECT_CLASS}
          onChange={(e) => {
            setBandFilter(e.target.value as SeoHealthBand | "all")
            setPage(1)
          }}
          value={bandFilter}
        >
          <option value="all">All bands</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <input
          className={cn(SELECT_CLASS, "min-w-[160px] flex-1")}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by title…"
          type="search"
          value={search}
        />

        <Button
          onClick={() => exportCsv(filtered)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Download aria-hidden className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <AdminDataTable>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Score</th>
              <th className="px-4 py-3 text-left font-medium">Band</th>
              <th className="px-4 py-3 text-right font-medium">Issues</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paged.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No items match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                  key={item.id}
                  onClick={() => openItem(item)}
                >
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {item.title}
                      {recentlyFixed.has(item.id) ? (
                        <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                          NEW
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {item.type}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={item.score} />
                  </td>
                  <td className="px-4 py-3">
                    <BandBadge band={item.band} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {item.issueCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-primary">Fix →</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminDataTable>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {filtered.length} items
          </p>
          <div className="flex gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <SeoAuditDrawer
        allItems={result.items}
        item={selected}
        onApplied={handleApplied}
        onOpenChange={setDrawerOpen}
        onSelectItem={openItem}
        open={drawerOpen}
      />
    </>
  )
}
