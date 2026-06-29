"use client"

import {
  CheckCircle2,
  ChevronRight,
  CircleX,
  ExternalLink,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

// ─── types ────────────────────────────────────────────────────────────────────

export type AuditBandVariant = "good" | "warn" | "bad"

export type AuditBandItem = {
  id: string
  title: string
  score: number
  type: string
  publicPath?: string
}

export type AuditBand = {
  label: string
  count: number
  variant: AuditBandVariant
  items: AuditBandItem[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const CIRCLE_R = 44
const CIRCLE_CX = 54
const CIRCLE_CY = 54
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R // ≈ 276.5

function scoreGrade(score: number, green: number, yellow: number) {
  if (score >= green) return "good" as const
  if (score >= yellow) return "warn" as const
  return "bad" as const
}

const gradeText: Record<AuditBandVariant, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
}

const gradeStroke: Record<AuditBandVariant, string> = {
  good: "#10b981",
  warn: "#fbbf24",
  bad: "#ef4444",
}

const bandCountColor: Record<AuditBandVariant, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
}

// ─── sub-components ───────────────────────────────────────────────────────────

function CircleProgress({
  score,
  grade,
}: {
  score: number
  grade: AuditBandVariant
}) {
  const clamped = Math.min(100, Math.max(0, score))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex size-[108px] items-center justify-center">
        <svg
          className="absolute inset-0"
          fill="none"
          height="108"
          viewBox="0 0 108 108"
          width="108"
        >
          <circle
            className="text-muted-foreground"
            cx={CIRCLE_CX}
            cy={CIRCLE_CY}
            r={CIRCLE_R}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth="7"
          />
          <circle
            cx={CIRCLE_CX}
            cy={CIRCLE_CY}
            r={CIRCLE_R}
            stroke={gradeStroke[grade]}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="7"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "54px 54px",
            }}
          />
        </svg>
        <span
          className={`relative z-10 text-xl font-bold tabular-nums ${gradeText[grade]}`}
        >
          {score}%
        </span>
      </div>
      <p className="text-muted-foreground text-[11px]">avg score</p>
    </div>
  )
}

function BandIcon({ variant }: { variant: AuditBandVariant }) {
  if (variant === "good")
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
  if (variant === "warn")
    return <TriangleAlert className="size-4 shrink-0 text-amber-500" />
  return <CircleX className="size-4 shrink-0 text-red-500" />
}

function ScorePill({
  score,
  variant,
}: {
  score: number
  variant: AuditBandVariant
}) {
  const bg: Record<AuditBandVariant, string> = {
    good: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    bad: "bg-red-500/10 text-red-700 dark:text-red-400",
  }
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${bg[variant]}`}
    >
      {score}%
    </span>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export function AuditBandCard({
  title,
  href,
  avgScore,
  greenThreshold,
  yellowThreshold,
  bands,
  auditedAt,
}: {
  title: string
  href: string
  avgScore: number
  greenThreshold: number
  yellowThreshold: number
  bands: AuditBand[]
  auditedAt?: string
}) {
  const [activeBand, setActiveBand] = useState<AuditBand | null>(null)
  const grade = scoreGrade(avgScore, greenThreshold, yellowThreshold)

  return (
    <>
      <div className="bg-card/40 border-border/60 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm">
        {/* Header */}
        <div className="border-border/60 flex items-center justify-between border-b px-5 py-3.5">
          <h4 className="text-sm font-semibold">{title}</h4>
          <Link
            className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs transition-colors"
            href={href}
          >
            Full audit <ChevronRight className="size-3" />
          </Link>
        </div>

        {/* Body */}
        <div className="flex items-center justify-between gap-4 p-5">
          {/* Left — band tags */}
          <div className="flex w-[148px] flex-col gap-2">
            {bands.map((band) => (
              <button
                className="group flex w-full cursor-pointer items-center gap-2 text-left"
                key={band.label}
                onClick={() => band.count > 0 && setActiveBand(band)}
                type="button"
              >
                <BandIcon variant={band.variant} />
                <span className="text-muted-foreground group-hover:text-foreground flex-1 text-xs leading-none transition-colors">
                  {band.label}
                </span>
                <span
                  className={`min-w-[1.5rem] text-right text-xs leading-none font-semibold tabular-nums ${bandCountColor[band.variant]}`}
                >
                  {band.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right — circle */}
          <div className="shrink-0 self-center">
            <CircleProgress grade={grade} score={avgScore} />
          </div>
        </div>

        {auditedAt ? (
          <p className="text-muted-foreground/60 border-border/40 border-t px-5 py-2 text-[10px]">
            Audited {relativeTime(auditedAt)}
          </p>
        ) : null}
      </div>

      {/* Band detail modal */}
      <Dialog
        open={activeBand !== null}
        onOpenChange={(open) => {
          if (!open) setActiveBand(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {title} — {activeBand?.label}{" "}
              <span className="text-muted-foreground font-normal">
                ({activeBand?.count} item{activeBand?.count !== 1 ? "s" : ""})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {activeBand?.items.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No items in this category.
              </p>
            ) : (
              activeBand?.items.map((item) => (
                <div
                  className="bg-muted/30 flex items-center gap-3 rounded-lg p-3"
                  key={item.id}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-xs font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-[10px] capitalize">
                      {item.type}
                    </p>
                  </div>
                  <ScorePill score={item.score} variant={activeBand.variant} />
                  {item.publicPath ? (
                    <a
                      className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      href={item.publicPath}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  )
}
