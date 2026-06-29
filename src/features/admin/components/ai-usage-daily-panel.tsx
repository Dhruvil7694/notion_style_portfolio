"use client"

import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Hash,
  Layers,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { AdminDataTable } from "@/features/admin/components/admin-panel"
import type { AiUsageTimeSeriesEntry } from "@/features/admin/lib/ai-usage-queries"
import { aiUsageTabHref } from "@/features/admin/lib/ai-usage-tabs"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"

type Props = {
  entries: AiUsageTimeSeriesEntry[]
  allEntries: AiUsageTimeSeriesEntry[]
  page: number
  totalPages: number
  totalCount: number
}

function formatUsd(v: number): string {
  return `$${v.toFixed(4)}`
}

// ─── Scroll area ──────────────────────────────────────────────────────────────

function DailyDetailScrollArea({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowHint(
      el.scrollHeight > el.clientHeight + 4 &&
        el.scrollTop + el.clientHeight < el.scrollHeight - 8
    )
  }, [])

  useEffect(() => {
    if (!active) {
      setShowHint(false)
      return
    }
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const frame = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [active, update])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {showHint ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-popover from-25% via-popover/75 to-transparent"
          />
          <button
            aria-label="Scroll down for more"
            className="absolute bottom-5 left-1/2 z-20 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-background/80 text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:text-foreground"
            onClick={() =>
              scrollRef.current?.scrollBy({
                top: scrollRef.current.clientHeight * 0.75,
                behavior: "smooth",
              })
            }
            type="button"
          >
            <ChevronDown aria-hidden className="size-4" />
          </button>
        </>
      ) : null}
    </div>
  )
}

// ─── Date picker dropdown ─────────────────────────────────────────────────────

function DatePickerDropdown({
  currentDate,
  allEntries,
  onSelect,
}: {
  currentDate: string
  allEntries: AiUsageTimeSeriesEntry[]
  onSelect: (entry: AiUsageTimeSeriesEntry) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Sort newest first
  const sorted = [...allEntries].sort((a, b) => b.date.localeCompare(a.date))

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-label="Select date"
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
          open
            ? "border-white/20 bg-white/15 text-foreground"
            : "border-white/10 bg-white/5 text-foreground hover:bg-white/10"
        )}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Calendar
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <span className="font-mono text-sm tabular-nums">{currentDate}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3 text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-background/80 shadow-xl backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sorted.map((entry) => {
              const isActive = entry.date === currentDate
              return (
                <button
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-white/15 text-foreground"
                      : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
                  )}
                  key={entry.date}
                  onClick={() => {
                    onSelect(entry)
                    setOpen(false)
                  }}
                  type="button"
                >
                  <span className="font-mono tabular-nums">{entry.date}</span>
                  <span className="text-xs opacity-60">
                    {entry.requests}req
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function DailyDetailSheet({
  entry,
  allEntries,
  open,
  onOpenChange,
  onSelectEntry,
}: {
  entry: AiUsageTimeSeriesEntry | null
  allEntries: AiUsageTimeSeriesEntry[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelectEntry: (entry: AiUsageTimeSeriesEntry) => void
}) {
  if (!entry) return null

  const avgCostPerRequest = entry.requests > 0 ? entry.cost / entry.requests : 0
  const avgTokensPerRequest =
    entry.requests > 0 ? Math.round(entry.tokens / entry.requests) : 0
  const costPer1kTokens =
    entry.tokens > 0 ? (entry.cost / entry.tokens) * 1000 : 0

  const sortedAll = [...allEntries].sort((a, b) => b.date.localeCompare(a.date))
  const currentIdx = sortedAll.findIndex((e) => e.date === entry.date)
  const prevEntry =
    currentIdx < sortedAll.length - 1 ? sortedAll[currentIdx + 1] : null
  const nextEntry = currentIdx > 0 ? sortedAll[currentIdx - 1] : null

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[36rem] sm:!max-w-[min(36rem,92vw)]"
        showCloseButton={false}
        side="right"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
          <SheetTitle className="sr-only">Daily breakdown</SheetTitle>

          <div className="flex items-center gap-3">
            {/* Title + date picker */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="shrink-0 text-sm font-semibold">
                Daily breakdown
              </span>
              <span className="text-white/20">|</span>
              <DatePickerDropdown
                allEntries={allEntries}
                currentDate={entry.date}
                onSelect={onSelectEntry}
              />
            </div>

            {/* Prev / Next arrows */}
            <div className="flex items-center gap-1">
              <button
                aria-label="Previous day"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!prevEntry}
                onClick={() => prevEntry && onSelectEntry(prevEntry)}
                type="button"
              >
                <ChevronLeft aria-hidden className="size-3.5" />
              </button>
              <button
                aria-label="Next day"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!nextEntry}
                onClick={() => nextEntry && onSelectEntry(nextEntry)}
                type="button"
              >
                <ChevronRight aria-hidden className="size-3.5" />
              </button>
            </div>

            {/* Close */}
            <button
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <span aria-hidden className="text-base leading-none">
                ×
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <DailyDetailScrollArea active={open}>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                {
                  label: "Requests",
                  value: entry.requests.toLocaleString("en-US"),
                  icon: Hash,
                },
                {
                  label: "Total tokens",
                  value: entry.tokens.toLocaleString("en-US"),
                  icon: Layers,
                },
                {
                  label: "Tracked cost",
                  value: formatUsd(entry.cost),
                  icon: CircleDollarSign,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm shadow-sm backdrop-blur-sm"
                  key={label}
                >
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                    <Icon aria-hidden className="size-3.5" />
                    {label}
                  </div>
                  <p className="font-mono font-semibold tabular-nums">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm shadow-sm backdrop-blur-sm">
              <p className="font-medium">Derived metrics</p>
              <dl className="space-y-2.5 text-sm">
                {[
                  {
                    label: "Avg cost / request",
                    value: formatUsd(avgCostPerRequest),
                  },
                  {
                    label: "Avg tokens / request",
                    value: avgTokensPerRequest.toLocaleString("en-US"),
                  },
                  {
                    label: "Cost / 1K tokens",
                    value: `$${costPer1kTokens.toFixed(6)}`,
                  },
                ].map(({ label, value }) => (
                  <div
                    className="flex items-baseline justify-between gap-3"
                    key={label}
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-mono tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm shadow-sm backdrop-blur-sm">
              <p className="font-medium">Token volume</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-sky-500/85"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-muted-foreground text-xs tabular-nums">
                {entry.tokens.toLocaleString("en-US")} total tokens across{" "}
                {entry.requests} request{entry.requests !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </DailyDetailScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AiUsageDailyBreakdownPanel({
  entries,
  allEntries,
  page,
  totalPages,
  totalCount,
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<AiUsageTimeSeriesEntry | null>(null)
  const [open, setOpen] = useState(false)

  function openEntry(entry: AiUsageTimeSeriesEntry) {
    setSelected(entry)
    setOpen(true)
  }

  function goToPage(next: number) {
    if (next < 1 || (totalPages > 0 && next > totalPages)) return
    const params = new URLSearchParams()
    params.set("tab", "analysis")
    if (next > 1) params.set("tsPage", String(next))
    router.push(`/admin/ai?${params.toString()}`)
  }

  return (
    <>
      <AdminDataTable>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Requests</th>
              <th className="px-4 py-3 text-right font-medium">Tokens</th>
              <th className="px-4 py-3 text-right font-medium">Tracked cost</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {entries.length === 0 ? (
              <tr>
                <td
                  className="text-muted-foreground px-4 py-8 text-center"
                  colSpan={4}
                >
                  No data yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  key={entry.date}
                  onClick={() => openEntry(entry)}
                >
                  <td className="px-4 py-3 tabular-nums">{entry.date}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {entry.requests}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {entry.tokens.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatUsd(entry.cost)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminDataTable>

      {totalCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} · {totalCount} days
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ChevronLeft aria-hidden className="size-4" />
              Previous
            </Button>
            <Button
              disabled={totalPages === 0 || page >= totalPages}
              onClick={() => goToPage(page + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              Next
              <ChevronRight aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <DailyDetailSheet
        allEntries={allEntries}
        entry={selected}
        onOpenChange={setOpen}
        onSelectEntry={openEntry}
        open={open}
      />
    </>
  )
}
