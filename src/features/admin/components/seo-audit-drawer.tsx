"use client"

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { SeoAuditScore } from "@/features/seo/lib/audit/types"
import { cn } from "@/shared/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"

function BandBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
        Healthy
      </span>
    )
  if (score >= 50)
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        Warning
      </span>
    )
  return (
    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
      Critical
    </span>
  )
}

function ScrollArea({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setHint(
      el.scrollHeight > el.clientHeight + 4 &&
        el.scrollTop + el.clientHeight < el.scrollHeight - 8
    )
  }, [])

  useEffect(() => {
    if (!active) {
      setHint(false)
      return
    }
    const el = ref.current
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
        ref={ref}
        className="h-full overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {hint ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-background/60 to-transparent"
        />
      ) : null}
    </div>
  )
}

type Props = {
  item: SeoAuditScore | null
  allItems: SeoAuditScore[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelectItem: (item: SeoAuditScore) => void
}

export function SeoAuditDrawer({
  item,
  allItems,
  open,
  onOpenChange,
  onSelectItem,
}: Props) {
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setEditTitle(
        item.checks.find((c) => c.ruleId === "seo_title_length")
          ?.currentValue ?? ""
      )
      setEditDesc(
        item.checks.find((c) => c.ruleId === "seo_desc_length")?.currentValue ??
          ""
      )
      setSaveError(null)
    }
    // Intentional: reset only on id change, not on every item field update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  if (!item) return null

  const currentIdx = allItems.findIndex((i) => i.id === item.id)
  const prevItem =
    currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null
  const nextItem = currentIdx > 0 ? allItems[currentIdx - 1] : null

  async function handleSave() {
    if (!item) return
    if (editTitle.length < 1 || editTitle.length > 70) {
      setSaveError("SEO title must be 1–70 chars")
      return
    }
    if (editDesc.length < 1 || editDesc.length > 160) {
      setSaveError("SEO description must be 1–160 chars")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/admin/seo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: item.table,
          id: item.id,
          seo_title: editTitle,
          seo_description: editDesc,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setSaveError(data.error ?? "Save failed")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[40rem] sm:!max-w-[min(40rem,92vw)]"
        showCloseButton={false}
        side="right"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
          <SheetTitle className="sr-only">SEO Audit</SheetTitle>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <span className="shrink-0 text-sm font-semibold">SEO Audit</span>
              <span className="text-white/20">|</span>
              <span className="min-w-0 truncate text-sm capitalize text-muted-foreground">
                {item.type} · {item.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="Previous item"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!prevItem}
                onClick={() => prevItem && onSelectItem(prevItem)}
                type="button"
              >
                <ChevronLeft aria-hidden className="size-3.5" />
              </button>
              <button
                aria-label="Next item"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!nextItem}
                onClick={() => nextItem && onSelectItem(nextItem)}
                type="button"
              >
                <ChevronRight aria-hidden className="size-3.5" />
              </button>
            </div>
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
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {item.score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
            <BandBadge score={item.score} />
            <span className="ml-auto text-xs text-muted-foreground">
              {item.issueCount} issue{item.issueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <ScrollArea active={open}>
          <div className="space-y-4 pt-4">
            {/* Rule checklist */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="mb-3 text-sm font-medium">Rule checklist</p>
              <div className="space-y-2">
                {item.checks.map((check) => (
                  <div
                    className="flex items-start gap-2.5 text-sm"
                    key={check.ruleId}
                  >
                    {check.passed ? (
                      <CheckCircle2
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                      />
                    ) : (
                      <XCircle
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-red-500 dark:text-red-400"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            !check.passed && "text-foreground"
                          )}
                        >
                          {check.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                          {check.earned}/{check.max}pts
                        </span>
                      </div>
                      {check.currentValue ? (
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {check.currentValue}
                        </p>
                      ) : null}
                      {check.suggestion ? (
                        <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                          {check.suggestion}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick-edit */}
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-sm font-medium">Quick-edit SEO fields</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="seo-title-edit"
                  >
                    SEO Title
                  </label>
                  <span
                    className={cn(
                      "tabular-nums text-xs",
                      editTitle.length > 60
                        ? "text-red-500"
                        : editTitle.length >= 30
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {editTitle.length}/60
                  </span>
                </div>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                  id="seo-title-edit"
                  maxLength={70}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="AI Engineer | Project Name"
                  type="text"
                  value={editTitle}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="seo-desc-edit"
                  >
                    SEO Description
                  </label>
                  <span
                    className={cn(
                      "tabular-nums text-xs",
                      editDesc.length > 160
                        ? "text-red-500"
                        : editDesc.length >= 120
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {editDesc.length}/160
                  </span>
                </div>
                <textarea
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                  id="seo-desc-edit"
                  maxLength={160}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Applied AI Engineer specializing in RAG, multi-agent systems, and production LLM infrastructure."
                  rows={3}
                  value={editDesc}
                />
              </div>

              {saveError ? (
                <p className="text-xs text-red-500" role="alert">
                  {saveError}
                </p>
              ) : null}

              <button
                className="w-full rounded-lg border border-white/10 bg-white/10 py-2 text-sm font-medium transition-colors hover:bg-white/15 disabled:opacity-50"
                disabled={saving}
                onClick={() => void handleSave()}
                type="button"
              >
                {saving ? "Saving…" : "Save & revalidate"}
              </button>
            </div>

            {/* Link to public page */}
            <a
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href={item.publicPath}
              rel="noopener noreferrer"
              target="_blank"
            >
              View public page
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
