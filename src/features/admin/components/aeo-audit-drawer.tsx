"use client"

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import type { AeoAuditScore } from "@/features/aeo/lib/audit/types"
import { cn } from "@/shared/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"
import { TextShimmer } from "@/shared/ui/text-shimmer"

// ── Types ──────────────────────────────────────────────────────────────────

type AeoPreview = {
  before: {
    ai_summary: string
    key_takeaways: string[]
    faq: Array<{ question: string; answer: string }>
    concepts: string[]
    summary: string
    expertise_slugs: string[]
  }
  after: {
    ai_summary: string
    key_takeaways: string[]
    faq: Array<{ question: string; answer: string }>
    concepts: string[]
    summary: string
    expertise_slugs: string[]
  }
  reasoning: string
}

type EditableAeoFix = {
  ai_summary: string
  key_takeaways: string[]
  faq: Array<{ question: string; answer: string }>
  concepts: string[]
  summary: string
  expertise_slugs: string[]
}

// Rules that cannot be auto-fixed — require CMS editing
const MANUAL_RULES = new Set([
  "expertise_linked", // requires expertise link in CMS (but we now auto-fix via expertise_slugs — keep here as fallback)
  "excerpt_answer_style",
  "structured_facts",
])

// ── Utilities ──────────────────────────────────────────────────────────────

function BandBadge({ score }: { score: number }) {
  if (score >= 75)
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Optimized
      </span>
    )
  if (score >= 40)
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        Partial
      </span>
    )
  return (
    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
      Missing
    </span>
  )
}

function ScoreBand({ score }: { score: number }) {
  const band = score >= 75 ? "Optimized" : score >= 40 ? "Partial" : "Missing"
  const color =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"
  return (
    <span className={cn("font-mono font-bold tabular-nums", color)}>
      {score}
      <span className="ml-1 text-xs font-normal">{band}</span>
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

// ── Checklist ──────────────────────────────────────────────────────────────

function RuleChecklist({
  checks,
  cmsPath,
}: {
  checks: AeoAuditScore["checks"]
  cmsPath: string
}) {
  const [passingOpen, setPassingOpen] = useState(false)

  const failing = checks.filter((c) => !c.passed)
  const passing = checks.filter((c) => c.passed)

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8">
        <p className="text-sm font-medium">AEO checklist</p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {passing.length}/{checks.length} passed
        </span>
      </div>

      {/* Failing rules */}
      {failing.length > 0 ? (
        <div className="divide-y divide-white/5">
          {failing.map((check) => {
            const isManual = MANUAL_RULES.has(check.ruleId)
            return (
              <div key={check.ruleId} className="px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 size-4 shrink-0 rounded-full bg-red-500/15 flex items-center justify-center">
                    <XCircle
                      className="size-3.5 text-red-500 dark:text-red-400"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{check.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        +{check.max}pts
                      </span>
                    </div>
                    {check.currentValue ? (
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {check.currentValue}
                      </p>
                    ) : null}
                    {check.suggestion ? (
                      <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
                        {check.suggestion}
                      </p>
                    ) : null}
                    {isManual ? (
                      <Link
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        href={cmsPath}
                      >
                        <Pencil aria-hidden className="size-3" />
                        Fix manually in CMS
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-3 py-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          All AEO rules passing
        </div>
      )}

      {/* Passing rules — collapsible */}
      {passing.length > 0 ? (
        <div className="border-t border-white/8">
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setPassingOpen((v) => !v)}
            type="button"
          >
            <span>
              {passing.length} passing rule{passing.length !== 1 ? "s" : ""}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3.5 transition-transform",
                passingOpen && "rotate-180"
              )}
            />
          </button>
          {passingOpen ? (
            <div className="divide-y divide-white/5 pb-1">
              {passing.map((check) => (
                <div
                  key={check.ruleId}
                  className="flex items-start gap-2.5 px-3 py-2"
                >
                  <div className="mt-0.5 size-4 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2
                      className="size-3.5 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-muted-foreground">
                        {check.label}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-emerald-600/70 dark:text-emerald-400/70">
                        {check.earned}pts
                      </span>
                    </div>
                    {check.currentValue ? (
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground/60">
                        {check.currentValue}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

type Props = {
  item: AeoAuditScore | null
  allItems: AeoAuditScore[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelectItem: (item: AeoAuditScore) => void
  onApplied?: (id: string) => void
}

export function AeoAuditDrawer({
  item,
  allItems,
  open,
  onOpenChange,
  onSelectItem,
  onApplied,
}: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<
    "idle" | "generating" | "preview" | "applying" | "done"
  >("idle")
  const [previewData, setPreviewData] = useState<AeoPreview | null>(null)
  const [editedFix, setEditedFix] = useState<EditableAeoFix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newScore, setNewScore] = useState<number | null>(null)
  const [newBand, setNewBand] = useState<string | null>(null)

  useEffect(() => {
    setPhase("idle")
    setPreviewData(null)
    setEditedFix(null)
    setError(null)
    setNewScore(null)
    setNewBand(null)
  }, [item?.id])

  async function handleGenerate() {
    if (!item) return
    setPhase("generating")
    setError(null)
    setPreviewData(null)
    setEditedFix(null)
    try {
      const res = await fetch("/api/admin/visibility/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: item.table,
          id: item.id,
          mode: "aeo",
          failingRuleIds: item.checks
            .filter((c) => !c.passed)
            .map((c) => c.ruleId),
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        before?: AeoPreview["before"]
        after?: AeoPreview["after"]
        reasoning?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Generation failed")
        setPhase("idle")
        return
      }
      const preview: AeoPreview = {
        before: data.before!,
        after: data.after!,
        reasoning: data.reasoning ?? "",
      }
      setPreviewData(preview)
      setEditedFix({ ...data.after! })
      setPhase("preview")
    } catch {
      setError("Network error")
      setPhase("idle")
    }
  }

  async function handleApply() {
    if (!item || !editedFix) return
    setPhase("applying")
    setError(null)
    try {
      const res = await fetch("/api/admin/visibility/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: item.table,
          id: item.id,
          mode: "aeo",
          itemType: item.type,
          update: editedFix,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        newScore?: number
        newBand?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Apply failed")
        setPhase("preview")
        return
      }
      if (data.newScore !== undefined) setNewScore(data.newScore)
      if (data.newBand) setNewBand(data.newBand)
      setPhase("done")
      if (item) onApplied?.(item.id)
      router.refresh()
    } catch {
      setError("Network error")
      setPhase("preview")
    }
  }

  function handleRegenerate() {
    setPhase("idle")
    setPreviewData(null)
    setEditedFix(null)
    setError(null)
    void handleGenerate()
  }

  if (!item) return null

  const currentIdx = allItems.findIndex((i) => i.id === item.id)
  const prevItem =
    currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null
  const nextItem = currentIdx > 0 ? allItems[currentIdx - 1] : null

  const passedCount = item.checks.filter((c) => c.passed).length
  const totalCount = item.checks.length

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[40rem] sm:!max-w-[min(40rem,92vw)]"
        showCloseButton={false}
        side="right"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
          <SheetTitle className="sr-only">AEO Audit</SheetTitle>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <span className="shrink-0 text-sm font-semibold">AEO</span>
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
              {phase === "done" && newScore !== null ? newScore : item.score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
            <BandBadge
              score={
                phase === "done" && newScore !== null ? newScore : item.score
              }
            />
            <span className="ml-auto text-xs text-muted-foreground">
              {passedCount}/{totalCount} rules passed
            </span>
          </div>
        </div>

        <ScrollArea active={open}>
          <div className="space-y-4 pt-4">
            {/* AI Fix card */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Fix all with AI</p>
                  {phase === "idle" ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Generates ai_summary, key_takeaways, FAQ, concepts,
                      summary + expertise links.
                    </p>
                  ) : phase === "generating" ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Generating…
                    </p>
                  ) : phase === "preview" ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Review and edit before confirming.
                    </p>
                  ) : phase === "applying" ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Writing to database…
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                      Applied. Checklist updated.
                    </p>
                  )}
                </div>

                {phase === "idle" ? (
                  <button
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                    onClick={() => void handleGenerate()}
                    type="button"
                  >
                    <Sparkles aria-hidden className="size-3.5" />
                    Fix with AI
                  </button>
                ) : phase === "generating" ? null : phase === "preview" ||
                  phase === "applying" ? (
                  <button
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    onClick={handleRegenerate}
                    type="button"
                  >
                    <RefreshCw aria-hidden className="size-3" />
                    Regenerate
                  </button>
                ) : (
                  <button
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    onClick={handleRegenerate}
                    type="button"
                  >
                    <RefreshCw aria-hidden className="size-3" />
                    Fix again
                  </button>
                )}
              </div>

              {/* Error */}
              {error ? (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              ) : null}

              {/* Generating shimmer */}
              {phase === "generating" ? (
                <div className="mt-3 space-y-1.5">
                  <TextShimmer className="text-sm" duration={2}>
                    Analyzing content and generating optimizations…
                  </TextShimmer>
                  <TextShimmer className="text-sm" duration={2.5} spread={15}>
                    Rewriting ai_summary, key takeaways, FAQ, concepts…
                  </TextShimmer>
                  <TextShimmer className="text-sm opacity-70" duration={3}>
                    Matching expertise areas from your CMS…
                  </TextShimmer>
                </div>
              ) : null}

              {/* Preview / edit */}
              {(phase === "preview" || phase === "applying") &&
              previewData &&
              editedFix ? (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-2.5">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      What AI improved
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {previewData.reasoning}
                    </p>
                  </div>

                  <DiffField
                    after={editedFix.ai_summary}
                    before={previewData.before.ai_summary}
                    label="AI Summary"
                    onEdit={(v) =>
                      setEditedFix((f) => f && { ...f, ai_summary: v })
                    }
                  />
                  <DiffField
                    after={editedFix.summary}
                    before={previewData.before.summary}
                    label="Excerpt / Summary"
                    onEdit={(v) =>
                      setEditedFix((f) => f && { ...f, summary: v })
                    }
                  />
                  <ListDiffField
                    before={previewData.before.key_takeaways}
                    items={editedFix.key_takeaways}
                    label="Key Takeaways"
                    onEdit={(v) =>
                      setEditedFix((f) => f && { ...f, key_takeaways: v })
                    }
                  />
                  <ListDiffField
                    before={previewData.before.concepts}
                    items={editedFix.concepts}
                    label="Concepts"
                    onEdit={(v) =>
                      setEditedFix((f) => f && { ...f, concepts: v })
                    }
                  />
                  <ListDiffField
                    before={previewData.before.expertise_slugs}
                    items={editedFix.expertise_slugs}
                    label="Expertise Links"
                    onEdit={(v) =>
                      setEditedFix((f) => f && { ...f, expertise_slugs: v })
                    }
                  />
                  <FaqDiffField
                    before={previewData.before.faq}
                    items={editedFix.faq}
                    label="FAQ"
                    onEdit={(v) => setEditedFix((f) => f && { ...f, faq: v })}
                  />

                  {/* Confirm bar */}
                  {phase === "applying" ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-3">
                        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <TextShimmer
                            className="text-sm font-medium"
                            duration={1.5}
                          >
                            Writing changes to database…
                          </TextShimmer>
                          <TextShimmer
                            className="text-xs"
                            duration={2}
                            spread={12}
                          >
                            Updating fields and recalculating score…
                          </TextShimmer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-[0.99] dark:text-emerald-300"
                      onClick={() => void handleApply()}
                      type="button"
                    >
                      <CheckCircle2 aria-hidden className="size-4" />
                      Apply all changes
                    </button>
                  )}
                </div>
              ) : null}

              {/* Done */}
              {phase === "done" ? (
                <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      aria-hidden
                      className="size-4 shrink-0 text-emerald-500"
                    />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Changes applied
                    </p>
                  </div>
                  {newScore !== null ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>New score:</span>
                      <ScoreBand score={newScore} />
                      {newBand ? (
                        <span className="text-muted-foreground">
                          ({newBand})
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Rule checklist */}
            <RuleChecklist checks={item.checks} cmsPath={item.cmsPath} />

            {/* Score gap callout */}
            {item.issueCount === 0 && item.score < 100 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 backdrop-blur-sm">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  All AEO rules pass — boost other signals
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Near-threshold values cause partial credit. Also improve SEO
                  metadata and GEO entity signals.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Link
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    href={`/admin/seo?highlight=${item.id}`}
                  >
                    Fix SEO →
                  </Link>
                  <Link
                    className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
                    href={`/admin/geo?highlight=${item.id}`}
                  >
                    <Sparkles aria-hidden className="size-3" />
                    Fix GEO →
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="space-y-2">
              <Link
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                href={item.cmsPath}
              >
                <Pencil aria-hidden className="size-3.5" />
                Edit in CMS
              </Link>
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ── Diff sub-components ────────────────────────────────────────────────────

function DiffField({
  label,
  before,
  after,
  onEdit,
}: {
  label: string
  before: string
  after: string
  onEdit: (v: string) => void
}) {
  const changed = before !== after
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {changed && before ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-500/70">
            Before
          </p>
          <p className="line-clamp-3 text-sm text-muted-foreground">{before}</p>
        </div>
      ) : null}
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-600/70">
          After {changed ? "(editable)" : "(no change)"}
        </p>
        <textarea
          className="w-full resize-none bg-transparent text-sm focus:outline-none"
          onChange={(e) => onEdit(e.target.value)}
          rows={Math.max(3, Math.ceil(after.length / 60))}
          value={after}
        />
      </div>
    </div>
  )
}

function ListDiffField({
  label,
  before,
  items,
  onEdit,
}: {
  label: string
  before: string[]
  items: string[]
  onEdit: (items: string[]) => void
}) {
  const beforeSet = new Set(before)
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-600/70">
          After (editable)
        </p>
        {items.map((item, idx) => {
          const isNew = !beforeSet.has(item)
          return (
            <div key={idx} className="flex items-start gap-2 py-1">
              <span
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  isNew ? "bg-emerald-500" : "bg-white/20"
                )}
              />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = e.target.value
                  onEdit(next)
                }}
                value={item}
              />
              <button
                className="text-sm text-muted-foreground hover:text-red-400"
                onClick={() => onEdit(items.filter((_, i) => i !== idx))}
                type="button"
              >
                ×
              </button>
            </div>
          )
        })}
        <button
          className="mt-2 text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          onClick={() => onEdit([...items, ""])}
          type="button"
        >
          + Add item
        </button>
      </div>
    </div>
  )
}

function FaqDiffField({
  label,
  before,
  items,
  onEdit,
}: {
  label: string
  before: Array<{ question: string; answer: string }>
  items: Array<{ question: string; answer: string }>
  onEdit: (faq: Array<{ question: string; answer: string }>) => void
}) {
  const beforeQs = new Set(before.map((f) => f.question))
  const [shownNew, setShownNew] = useState<Set<number>>(() => {
    const s = new Set<number>()
    items.forEach((faq, i) => {
      if (!beforeQs.has(faq.question)) s.add(i)
    })
    return s
  })

  useEffect(() => {
    if (shownNew.size === 0) return
    const t = setTimeout(() => setShownNew(new Set()), 4000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="space-y-2">
        {items.map((faq, idx) => {
          const isNew = shownNew.has(idx)
          return (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-2.5 transition-colors duration-700",
                isNew
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-white/10 bg-white/5"
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="mt-0.5 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Q{idx + 1}
                  </span>
                  {isNew ? (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 transition-opacity duration-700 dark:text-emerald-400">
                      NEW
                    </span>
                  ) : null}
                </div>
                <button
                  className="text-sm text-muted-foreground hover:text-red-400"
                  onClick={() => onEdit(items.filter((_, i) => i !== idx))}
                  type="button"
                >
                  ×
                </button>
              </div>
              <input
                className="mt-1.5 w-full bg-transparent text-sm font-medium focus:outline-none"
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = { ...next[idx]!, question: e.target.value }
                  onEdit(next)
                }}
                placeholder="Question…"
                value={faq.question}
              />
              <textarea
                className="mt-2 w-full overflow-hidden bg-transparent text-sm text-muted-foreground focus:outline-none"
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = "auto"
                  el.style.height = el.scrollHeight + "px"
                }}
                onChange={(e) => {
                  const next = [...items]
                  next[idx] = { ...next[idx]!, answer: e.target.value }
                  onEdit(next)
                }}
                placeholder="Answer…"
                rows={1}
                value={faq.answer}
              />
            </div>
          )
        })}
        <button
          className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          onClick={() => onEdit([...items, { question: "", answer: "" }])}
          type="button"
        >
          + Add FAQ item
        </button>
      </div>
    </div>
  )
}
