"use client"

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { AdminDataTable } from "@/features/admin/components/admin-panel"
import { useAiUsageLive } from "@/features/admin/components/ai-usage-live-shell"
import { LaunchFindingRow } from "@/features/admin/components/launch-status"
import { formatAdminDateTime } from "@/features/admin/lib/admin-datetime"
import type {
  AiCostBreakdownLine,
  AiCostVerificationResult,
  AiUsageCostBreakdown,
  AiUsageLogWithBreakdown,
} from "@/features/admin/lib/ai-cost-calculator"
import { providerDashboardUrl } from "@/features/admin/lib/ai-cost-verification"
import {
  varianceLabel,
  varianceLevel,
} from "@/features/admin/lib/ai-cost-verification"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"

type AiUsageQueriesPanelProps = {
  logs: AiUsageLogWithBreakdown[]
  allLogs: AiUsageLogWithBreakdown[]
  page: number
  totalPages: number
  totalCount: number
  days: number
}

const QUERY_DETAIL_SECTION =
  "rounded-xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm"

const QUERY_DETAIL_MUTED_SECTION = cn(QUERY_DETAIL_SECTION, "bg-white/5")

function formatRate(value: number): string {
  return `$${value.toFixed(6)}/1K`
}

function formatCompactCostFormula(tokens: number, ratePer1k: number): string {
  return `${tokens.toLocaleString("en-US")}×${ratePer1k}÷1000`
}

function buildQueryParameterRows(
  log: AiUsageLogWithBreakdown
): AiCostBreakdownLine[] {
  const { breakdown } = log

  return [
    {
      label: "Input tokens",
      formula: "Count",
      amount: breakdown.inputTokens.toLocaleString("en-US"),
    },
    {
      label: "Input rate",
      formula: "/1K",
      amount: formatRate(breakdown.inputRatePer1k),
    },
    {
      label: "Input cost",
      formula: formatCompactCostFormula(
        breakdown.inputTokens,
        breakdown.inputRatePer1k
      ),
      amount: formatUsd(breakdown.inputCost),
    },
    {
      label: "Output tokens",
      formula: "Count",
      amount: breakdown.outputTokens.toLocaleString("en-US"),
    },
    {
      label: "Output rate",
      formula: "/1K",
      amount: formatRate(breakdown.outputRatePer1k),
    },
    {
      label: "Output cost",
      formula: formatCompactCostFormula(
        breakdown.outputTokens,
        breakdown.outputRatePer1k
      ),
      amount: formatUsd(breakdown.outputCost),
    },
    {
      label: "Total tokens",
      formula: "In + out",
      amount: (breakdown.inputTokens + breakdown.outputTokens).toLocaleString(
        "en-US"
      ),
    },
    {
      label: "Computed total",
      formula: "In + out cost",
      amount: formatUsd(breakdown.computedCost),
    },
    {
      label: "Logged cost",
      formula: "cost_estimate",
      amount: formatUsd(breakdown.storedCost),
    },
    {
      label: "Variance",
      formula: "|logged − computed|",
      amount: breakdown.matches
        ? formatUsd(0)
        : `${formatUsd(breakdown.varianceUsd)}${
            breakdown.variancePct !== null
              ? ` (${breakdown.variancePct.toFixed(2)}%)`
              : ""
          }`,
    },
  ]
}

function formatUsd(value: number): string {
  return `$${value.toFixed(6)}`
}

function splitPercent(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

function formatRateSourceLabel(breakdown: AiUsageCostBreakdown): string {
  const source = breakdown.rateSource === "registry" ? "Registry" : "Fallback"
  return breakdown.modelLabel ? `${source} · ${breakdown.modelLabel}` : source
}

function buildPlainEnglishFormula(log: AiUsageLogWithBreakdown): string {
  const { breakdown } = log
  return `(${breakdown.inputTokens.toLocaleString("en-US")} tokens × ${formatRate(breakdown.inputRatePer1k)}) + (${breakdown.outputTokens.toLocaleString("en-US")} tokens × ${formatRate(breakdown.outputRatePer1k)}) = ${formatUsd(breakdown.computedCost)}`
}

function providerDashboardLabel(provider: string): string {
  const key = provider.toLowerCase()
  if (key === "openai") return "Compare on OpenAI dashboard"
  if (key === "anthropic") return "Compare on Anthropic dashboard"
  if (key === "openrouter") return "Compare on OpenRouter dashboard"
  if (key === "groq") return "Compare on Groq dashboard"
  if (key === "gemini" || key === "google")
    return "Compare on Google Cloud dashboard"
  if (key === "nvidia") return "Compare on NVIDIA dashboard"
  return `Compare on ${provider} dashboard`
}

function SplitBarSection({
  label,
  summary,
  inputPct,
  outputPct,
  monoSummary = false,
}: {
  label: string
  summary: string
  inputPct: number
  outputPct: number
  monoSummary?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums", monoSummary && "font-mono")}>
          {summary}
        </span>
      </div>
      <div
        aria-label={`Input ${label.toLowerCase()} ${inputPct.toFixed(1)} percent, output ${label.toLowerCase()} ${outputPct.toFixed(1)} percent`}
        className="bg-muted flex h-2 w-full overflow-hidden rounded-full"
        role="img"
      >
        <div
          className="bg-sky-500/85 h-full shrink-0"
          style={{ width: `${inputPct}%` }}
        />
        <div
          className="bg-violet-500/85 h-full shrink-0"
          style={{ width: `${outputPct}%` }}
        />
      </div>
      <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
        <span>Input {inputPct.toFixed(1)}%</span>
        <span>Output {outputPct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function QueryCostTokenSplit({
  breakdown,
}: {
  breakdown: AiUsageLogWithBreakdown["breakdown"]
}) {
  const totalTokens = breakdown.inputTokens + breakdown.outputTokens
  const totalCost = breakdown.inputCost + breakdown.outputCost
  const inputTokenPct = splitPercent(breakdown.inputTokens, totalTokens)
  const outputTokenPct = splitPercent(breakdown.outputTokens, totalTokens)
  const inputCostPct = splitPercent(breakdown.inputCost, totalCost)
  const outputCostPct = splitPercent(breakdown.outputCost, totalCost)

  return (
    <div className={cn(QUERY_DETAIL_MUTED_SECTION, "space-y-4 p-3 text-sm")}>
      <p className="font-medium">Cost & token split</p>
      <SplitBarSection
        inputPct={inputTokenPct}
        label="Tokens"
        outputPct={outputTokenPct}
        summary={`${breakdown.inputTokens.toLocaleString("en-US")} in · ${breakdown.outputTokens.toLocaleString("en-US")} out`}
      />
      <SplitBarSection
        inputPct={inputCostPct}
        label="Cost"
        monoSummary
        outputPct={outputCostPct}
        summary={`${formatUsd(breakdown.inputCost)} in · ${formatUsd(breakdown.outputCost)} out`}
      />
    </div>
  )
}

function QueryPlainEnglishFormula({ log }: { log: AiUsageLogWithBreakdown }) {
  return (
    <div className={cn(QUERY_DETAIL_MUTED_SECTION, "bg-card/20 p-3 text-sm")}>
      <p className="text-muted-foreground mb-1.5 text-xs font-medium">
        Formula recap
      </p>
      <p className="font-mono text-sm leading-relaxed break-all">
        {buildPlainEnglishFormula(log)}
      </p>
    </div>
  )
}

function QueryRateSnapshot({ breakdown }: { breakdown: AiUsageCostBreakdown }) {
  return (
    <div className={cn(QUERY_DETAIL_MUTED_SECTION, "h-full p-3 text-sm")}>
      <p className="mb-3 font-medium">Rate snapshot</p>
      <dl className="space-y-2.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Input</dt>
          <dd className="font-mono tabular-nums">
            {formatRate(breakdown.inputRatePer1k)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Output</dt>
          <dd className="font-mono tabular-nums">
            {formatRate(breakdown.outputRatePer1k)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Source</dt>
          <dd className="text-right capitalize">
            {formatRateSourceLabel(breakdown)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function QueryLogIdCopy({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 break-all font-mono text-xs">{id}</code>
      <Button
        aria-label={copied ? "Copied log ID" : "Copy log ID"}
        className="size-7 shrink-0"
        onClick={() => void handleCopy()}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        {copied ? (
          <Check
            aria-hidden
            className="size-3.5 text-green-600 dark:text-green-400"
          />
        ) : (
          <Copy aria-hidden className="size-3.5" />
        )}
      </Button>
    </div>
  )
}

function QueryRecordCard({ log }: { log: AiUsageLogWithBreakdown }) {
  return (
    <div className={cn(QUERY_DETAIL_MUTED_SECTION, "h-full p-3 text-sm")}>
      <p className="mb-3 font-medium">Query record</p>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Log ID</dt>
          <dd className="mt-1">
            <QueryLogIdCopy id={log.id} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Timestamp</dt>
          <dd className="mt-1 tabular-nums">
            {formatAdminDateTime(log.createdAt)}
          </dd>
        </div>
        {!log.success && log.errorMessage ? (
          <div>
            <dt className="text-muted-foreground text-xs">Error</dt>
            <dd className="text-destructive mt-1 break-words">
              {log.errorMessage}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

function QueryProviderDashboardLink({ provider }: { provider: string }) {
  const url = providerDashboardUrl(provider)
  if (!url) return null

  return (
    <div className={cn(QUERY_DETAIL_SECTION, "p-3")}>
      <Link
        className="text-primary group flex w-full items-center justify-center gap-1.5 text-sm no-underline hover:underline"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {providerDashboardLabel(provider)}
        <ExternalLink
          aria-hidden
          className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </Link>
    </div>
  )
}

function QueryDetailScrollArea({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hasOverflow = el.scrollHeight > el.clientHeight + 4
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
    setShowScrollHint(hasOverflow && !atBottom)
  }, [])

  useEffect(() => {
    if (!active) {
      setShowScrollHint(false)
      return
    }

    const el = scrollRef.current
    if (!el) return

    updateScrollHint()
    el.addEventListener("scroll", updateScrollHint, { passive: true })
    const resizeObserver = new ResizeObserver(updateScrollHint)
    resizeObserver.observe(el)

    const frame = window.requestAnimationFrame(updateScrollHint)

    return () => {
      window.cancelAnimationFrame(frame)
      el.removeEventListener("scroll", updateScrollHint)
      resizeObserver.disconnect()
    }
  }, [active, updateScrollHint])

  function scrollDown() {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: el.clientHeight * 0.75, behavior: "smooth" })
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {showScrollHint ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-background/60 from-25% via-background/30 to-transparent"
          />
          <button
            aria-label="Scroll down for more"
            className="absolute bottom-5 left-1/2 z-20 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-background/80 text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:text-foreground"
            onClick={scrollDown}
            type="button"
          >
            <ChevronDown aria-hidden className="size-4" />
          </button>
        </>
      ) : null}
    </div>
  )
}

/** Hand-drawn pencil circle — repeated strokes; layered above row, no layout overflow. */
function PencilCircleMark({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative isolate inline-block">
      <svg
        aria-hidden
        className="text-foreground pointer-events-none absolute top-1/2 left-1/2 z-30 h-[50px] w-[130px] -translate-x-1/2 -translate-y-[58%]"
        viewBox="0 0 152 58"
      >
        {/* Pass 1 — light first stroke, gap at top-right */}
        <path
          d="M20 29 C 14 11, 44 5, 76 7 C 108 9, 131 14, 133 29"
          fill="none"
          opacity="0.28"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
        {/* Pass 2 — main loop, slightly tighter */}
        <path
          d="M17 28 C 11 9, 41 3, 74 5 C 107 7, 131 11, 133 28 C 135 45, 109 51, 74 50 C 39 49, 15 43, 13 29 C 12 25, 14 21, 17 28"
          fill="none"
          opacity="0.42"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.35"
        />
        {/* Pass 3 — second lap, offset */}
        <path
          d="M19 27 C 13 10, 43 4, 75 6 C 107 8, 129 13, 131 27 C 133 41, 107 49, 73 48 C 38 47, 17 41, 15 28"
          fill="none"
          opacity="0.38"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.15"
        />
        {/* Pass 4 — heavier pressure on bottom arc */}
        <path
          d="M22 32 C 28 46, 52 52, 76 51 C 100 50, 122 44, 126 32"
          fill="none"
          opacity="0.52"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        {/* Pass 5 — reconnect / overlap at start */}
        <path
          d="M16 26 C 12 18, 18 12, 26 10 C 34 8, 42 9, 48 12"
          fill="none"
          opacity="0.45"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.25"
        />
        {/* Pass 6 — left side reinforcement */}
        <path
          d="M14 30 C 10 24, 11 18, 16 14 C 21 10, 28 9, 34 11"
          fill="none"
          opacity="0.32"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.1"
        />
        {/* Pencil tail / lift-off mark */}
        <path
          d="M130 16 C 134 20, 136 25, 133 30"
          fill="none"
          opacity="0.55"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
        <path
          d="M132 14 C 135 17, 136 20, 134 23"
          fill="none"
          opacity="0.35"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="0.95"
        />
        {/* Small graphite smudge */}
        <ellipse
          cx="124"
          cy="18"
          fill="currentColor"
          opacity="0.12"
          rx="2.2"
          ry="1.4"
        />
      </svg>
      <span className="relative z-40 font-mono font-semibold tabular-nums">
        {children}
      </span>
    </span>
  )
}

function StatusIcon({ matches }: { matches: boolean }) {
  if (matches) {
    return (
      <CheckCircle2
        aria-hidden
        className="size-4 shrink-0 text-green-600 dark:text-green-400"
      />
    )
  }
  return (
    <XCircle
      aria-hidden
      className="size-4 shrink-0 text-red-600 dark:text-red-400"
    />
  )
}

function QueryDetailSheet({
  log,
  allLogs,
  open,
  onOpenChange,
  onSelectLog,
}: {
  log: AiUsageLogWithBreakdown | null
  allLogs: AiUsageLogWithBreakdown[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectLog: (log: AiUsageLogWithBreakdown) => void
}) {
  if (!log) return null

  const { breakdown } = log
  const parameterRows = buildQueryParameterRows(log)

  // newest first (already ordered, but normalize)
  const sorted = [...allLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const currentIdx = sorted.findIndex((l) => l.id === log.id)
  const prevLog = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null
  const nextLog = currentIdx > 0 ? sorted[currentIdx - 1] : null

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[44rem] sm:!max-w-[min(44rem,92vw)]"
        showCloseButton={false}
        side="right"
      >
        {/* Custom header */}
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
          <SheetTitle className="sr-only">Query cost breakdown</SheetTitle>

          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <span className="shrink-0 text-sm font-semibold">
                Query cost breakdown
              </span>
              <span className="text-white/20">|</span>
              <span className="min-w-0 truncate text-sm text-muted-foreground">
                <span className="capitalize">{log.provider}</span>
                {" · "}
                <span className="font-mono text-xs">{log.model}</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                aria-label="Previous query"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!prevLog}
                onClick={() => prevLog && onSelectLog(prevLog)}
                type="button"
              >
                <ChevronLeft aria-hidden className="size-3.5" />
              </button>
              <button
                aria-label="Next query"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!nextLog}
                onClick={() => nextLog && onSelectLog(nextLog)}
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

          {/* Timestamp sub-row */}
          <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
            {formatAdminDateTime(log.createdAt)}
          </p>
        </div>

        <QueryDetailScrollArea active={open}>
          <div className="space-y-4 pt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className={cn(QUERY_DETAIL_MUTED_SECTION, "p-3 text-sm")}>
                <p className="text-muted-foreground text-xs">Role</p>
                <p className="mt-1 capitalize font-medium">{log.role}</p>
              </div>
              <div className={cn(QUERY_DETAIL_MUTED_SECTION, "p-3 text-sm")}>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  {log.success ? (
                    <CheckCircle2
                      aria-hidden
                      className="size-4 text-green-600 dark:text-green-400"
                    />
                  ) : (
                    <XCircle
                      aria-hidden
                      className="size-4 text-red-600 dark:text-red-400"
                    />
                  )}
                  {log.success ? "Success" : "Failed"}
                </p>
              </div>
              <div className={cn(QUERY_DETAIL_MUTED_SECTION, "p-3 text-sm")}>
                <p className="text-muted-foreground text-xs">Latency</p>
                <p className="mt-1 font-medium tabular-nums">
                  {log.latencyMs}ms
                </p>
              </div>
              <div className={cn(QUERY_DETAIL_MUTED_SECTION, "p-3 text-sm")}>
                <p className="text-muted-foreground text-xs">Rate source</p>
                <p className="mt-1 font-medium capitalize">
                  {breakdown.rateSource}
                  {breakdown.modelLabel ? ` · ${breakdown.modelLabel}` : null}
                </p>
              </div>
            </div>

            <AdminDataTable className="shadow-md [&>div]:overflow-hidden">
              <table className="relative w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[40%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr className="border-border/60 relative z-0 border-b bg-card/50">
                    <th className="px-3 py-2.5 text-left font-medium">
                      Parameter
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium">
                      Detail
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="relative z-0 divide-border divide-y">
                  {parameterRows.map((line) => (
                    <tr key={line.label}>
                      <td className="px-3 py-2 font-medium">{line.label}</td>
                      <td className="text-muted-foreground px-3 py-2 font-mono text-xs break-all">
                        {line.formula}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {line.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="relative z-20">
                  <tr className="border-border/60 relative border-t-2 bg-card/50">
                    <td className="px-3 py-2.5 font-semibold">Total cost</td>
                    <td className="text-muted-foreground px-3 py-2.5 font-mono text-xs break-all">
                      {formatUsd(breakdown.inputCost)}+
                      {formatUsd(breakdown.outputCost)}
                      {breakdown.matches
                        ? ""
                        : ` · logged ${formatUsd(breakdown.storedCost)}`}
                    </td>
                    <td className="relative px-3 py-2.5 text-right">
                      <PencilCircleMark>
                        {formatUsd(log.costEstimate)}
                      </PencilCircleMark>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </AdminDataTable>

            <QueryPlainEnglishFormula log={log} />

            <div className="grid gap-4 sm:grid-cols-2">
              <QueryRateSnapshot breakdown={breakdown} />
              <QueryRecordCard log={log} />
            </div>

            <QueryCostTokenSplit breakdown={breakdown} />

            <QueryProviderDashboardLink provider={log.provider} />

            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-sm shadow-md",
                breakdown.matches
                  ? "border-green-500/25 bg-green-500/10"
                  : "border-red-500/25 bg-red-500/10"
              )}
            >
              <StatusIcon matches={breakdown.matches} />
              <span>
                {breakdown.matches
                  ? "Stored cost matches formula recomputation."
                  : `Mismatch: stored ${formatUsd(breakdown.storedCost)} vs computed ${formatUsd(breakdown.computedCost)}.`}
              </span>
            </div>
          </div>
        </QueryDetailScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function AiUsageQueriesPanel({
  logs,
  allLogs,
  page,
  totalPages,
  totalCount,
  days,
}: AiUsageQueriesPanelProps) {
  const router = useRouter()
  const [selectedLog, setSelectedLog] =
    useState<AiUsageLogWithBreakdown | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!sheetOpen || !selectedLog) return
    const updated = allLogs.find((log) => log.id === selectedLog.id)
    if (updated) {
      setSelectedLog(updated)
    }
  }, [allLogs, sheetOpen, selectedLog?.id])

  function openLog(log: AiUsageLogWithBreakdown) {
    setSelectedLog(log)
    setSheetOpen(true)
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) return
    const params = new URLSearchParams({ tab: "queries" })
    if (nextPage > 1) {
      params.set("qPage", String(nextPage))
    }
    router.push(`/admin/ai?${params.toString()}`)
  }

  return (
    <>
      <AdminDataTable>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/60 border-b bg-card/40">
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Model</th>
              <th className="px-4 py-3 text-right font-medium">Tokens</th>
              <th className="px-4 py-3 text-right font-medium">Tracked</th>
              <th className="px-4 py-3 text-right font-medium">Computed</th>
              <th className="px-4 py-3 text-center font-medium">Match</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {logs.length === 0 ? (
              <tr>
                <td
                  className="text-muted-foreground px-4 py-8 text-center"
                  colSpan={7}
                >
                  No AI queries logged in the last {days} days.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  key={log.id}
                  onClick={() => openLog(log)}
                >
                  <td className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatAdminDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 capitalize">{log.provider}</td>
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs">
                    {log.model}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {log.inputTokens + log.outputTokens}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatUsd(log.costEstimate)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatUsd(log.breakdown.computedCost)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <StatusIcon matches={log.breakdown.matches} />
                    </div>
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
            Page {page} of {totalPages} · {totalCount} queries
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

      <QueryDetailSheet
        allLogs={allLogs}
        log={selectedLog}
        onOpenChange={setSheetOpen}
        onSelectLog={openLog}
        open={sheetOpen}
      />
    </>
  )
}

type AiUsageCostVerificationPanelProps = {
  days: number
}

function VerificationStatusIcon({
  status,
}: {
  status: AiCostVerificationResult["status"]
}) {
  if (status === "ok") {
    return (
      <CheckCircle2
        aria-hidden
        className="size-5 text-green-600 dark:text-green-400"
      />
    )
  }
  if (status === "warn") {
    return (
      <AlertTriangle
        aria-hidden
        className="size-5 text-amber-600 dark:text-amber-400"
      />
    )
  }
  return (
    <XCircle aria-hidden className="size-5 text-red-600 dark:text-red-400" />
  )
}

export function AiUsageCostVerificationPanel({
  days,
}: AiUsageCostVerificationPanelProps) {
  const { refreshGeneration } = useAiUsageLive()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AiCostVerificationResult | null>(null)
  const [hasAutoRun, setHasAutoRun] = useState(false)

  async function runVerification() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/ai-usage/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })

      if (!response.ok) {
        throw new Error("Verification request failed")
      }

      const data = (await response.json()) as AiCostVerificationResult
      setResult(data)
      setHasAutoRun(true)
    } catch {
      setError("Could not run cost verification. Try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void runVerification()
    // Re-run when live refresh ticks so verification stays current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshGeneration, days])

  async function handleVerify() {
    await runVerification()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Recompute every logged query using current model rates and compare to
          stored <code className="text-xs">cost_estimate</code> values.
        </p>
        <Button
          disabled={loading}
          onClick={() => void handleVerify()}
          type="button"
        >
          {loading ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <ShieldCheck aria-hidden className="size-4" />
          )}
          {loading
            ? "Verifying…"
            : hasAutoRun
              ? "Re-verify"
              : "Verify calculations"}
        </Button>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4",
              result.status === "ok" && "border-green-500/25 bg-green-500/10",
              result.status === "warn" && "border-amber-500/25 bg-amber-500/10",
              result.status === "error" && "border-red-500/25 bg-red-500/10"
            )}
          >
            <VerificationStatusIcon status={result.status} />
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {result.mismatchedQueries === 0
                  ? "All queries match the cost formula"
                  : `${result.mismatchedQueries} of ${result.totalQueries} queries differ from recomputation`}
              </p>
              <p className="text-muted-foreground text-sm">
                Tracked ${result.totalStoredCost.toFixed(6)} · Recomputed $
                {result.totalComputedCost.toFixed(6)} · Variance{" "}
                {result.variancePct.toFixed(2)}% (
                {varianceLabel(result.variancePct)})
              </p>
              <p className="text-muted-foreground text-xs">
                Verified {formatAdminDateTime(result.verifiedAt)}
              </p>
            </div>
          </div>

          {result.byProvider.length > 0 ? (
            <AdminDataTable>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border/60 border-b bg-card/40">
                    <th className="px-4 py-3 text-left font-medium">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Queries
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Tracked
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Recomputed
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Variance
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Mismatches
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Dashboard
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {result.byProvider.map((provider) => (
                    <tr key={provider.provider}>
                      <td className="px-4 py-3 capitalize font-medium">
                        {provider.provider}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {provider.queryCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        ${provider.storedCost.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        ${provider.computedCost.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {provider.variancePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {provider.mismatches}
                      </td>
                      <td className="px-4 py-3">
                        {provider.dashboardUrl ? (
                          <Link
                            className="text-primary inline-flex items-center gap-1 text-xs underline"
                            href={provider.dashboardUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Compare
                            <ExternalLink aria-hidden className="size-3" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminDataTable>
          ) : null}

          {result.sampleMismatches.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sample mismatches</p>
              <ul className="space-y-1.5">
                {result.sampleMismatches.map((log) => (
                  <LaunchFindingRow
                    key={log.id}
                    level="error"
                    message={`${log.provider}/${log.model}: stored ${formatUsd(log.costEstimate)} vs computed ${formatUsd(log.breakdown.computedCost)}`}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          <LaunchFindingRow
            level={varianceLevel(result.variancePct)}
            message={
              result.variancePct <= 10
                ? "Internal formula variance is within the 10% target — compare provider dashboard totals for billing accuracy."
                : "Variance exceeds 10% — review model rates in the registry or logs with mismatched rows."
            }
          />
        </div>
      ) : null}
    </div>
  )
}
