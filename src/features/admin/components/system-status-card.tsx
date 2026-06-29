"use client"

import {
  CheckCircle2,
  ChevronRight,
  TriangleAlert,
  XCircle,
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

// ─── types ───────────────────────────────────────────────────────────────────

type CheckStatus = "healthy" | "warning" | "critical"

type CheckResult = {
  id: string
  label: string
  status: CheckStatus
  message: string
  detail?: string
}

type SectionWithChecks = {
  title: string
  status: CheckStatus
  checks: CheckResult[]
}

type ModalMode =
  | { kind: "status"; filter: CheckStatus }
  | { kind: "section"; sectionTitle: string }
  | null

// ─── helpers ─────────────────────────────────────────────────────────────────

function scoreGrade(score: number, green: number, yellow: number) {
  if (score >= green) return "good" as const
  if (score >= yellow) return "warn" as const
  return "bad" as const
}

const gradeBar: Record<"good" | "warn" | "bad", string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-400",
  bad: "bg-red-500",
}

const gradeText: Record<"good" | "warn" | "bad", string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
}

const statusText: Record<CheckStatus, string> = {
  healthy: "OK",
  warning: "Warn",
  critical: "Fail",
}

const statusColor: Record<CheckStatus, string> = {
  healthy: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
}

// ─── icon helpers ─────────────────────────────────────────────────────────────

function StatusIcon({
  status,
  className,
}: {
  status: CheckStatus
  className?: string
}) {
  if (status === "healthy")
    return (
      <CheckCircle2
        className={className ?? "size-3.5 shrink-0 text-emerald-500"}
      />
    )
  if (status === "warning")
    return (
      <TriangleAlert
        className={className ?? "size-3.5 shrink-0 text-amber-500"}
      />
    )
  return <XCircle className={className ?? "size-3.5 shrink-0 text-red-500"} />
}

// ─── modal content ────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <div className="bg-muted/30 flex items-start gap-2.5 rounded-lg p-2.5">
      <StatusIcon
        className={`mt-0.5 size-4 shrink-0 ${
          check.status === "healthy"
            ? "text-emerald-500"
            : check.status === "warning"
              ? "text-amber-500"
              : "text-red-500"
        }`}
        status={check.status}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium">{check.label}</p>
        <p className="text-muted-foreground text-xs">{check.message}</p>
        {check.detail ? (
          <p className="text-muted-foreground/70 text-xs">{check.detail}</p>
        ) : null}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function SystemStatusCard({
  sections,
  overallScore,
  readyToDeploy,
}: {
  sections: SectionWithChecks[]
  overallScore: number
  readyToDeploy: boolean
}) {
  const [modal, setModal] = useState<ModalMode>(null)

  const grade = scoreGrade(overallScore, 90, 70)
  const healthyCount = sections.filter((s) => s.status === "healthy").length
  const warningCount = sections.filter((s) => s.status === "warning").length
  const criticalCount = sections.filter((s) => s.status === "critical").length

  // Resolve what to show in the dialog
  let modalTitle = ""
  let modalSections: { title: string; checks: CheckResult[] }[] = []

  if (modal?.kind === "status") {
    const f = modal.filter
    modalTitle =
      f === "healthy"
        ? "Passing checks"
        : f === "warning"
          ? "Warnings"
          : "Critical issues"
    modalSections = sections
      .map((s) => ({
        title: s.title,
        checks: s.checks.filter((c) => c.status === f),
      }))
      .filter((s) => s.checks.length > 0)
  } else if (modal?.kind === "section") {
    const sec = sections.find((s) => s.title === modal.sectionTitle)
    modalTitle = sec?.title ?? ""
    modalSections = sec ? [{ title: sec.title, checks: sec.checks }] : []
  }

  return (
    <>
      <div className="bg-card/40 border-border/60 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm">
        {/* Header */}
        <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">System Health</h4>
          <Link
            className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs transition-colors"
            href="/admin/system"
          >
            View all checks <ChevronRight className="size-3" />
          </Link>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-2 divide-x divide-border/40">
          {/* Left — score + bar + counts + badge */}
          <div className="flex flex-col justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Overall score</p>
              <span
                className={`text-4xl font-bold tabular-nums ${gradeText[grade]}`}
              >
                {overallScore}
                <span className="text-2xl">%</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${gradeBar[grade]}`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {overallScore}% of checks passing
              </p>
            </div>

            {/* Counts + deploy badge on one row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {healthyCount > 0 && (
                  <button
                    className="hover:bg-muted/60 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
                    onClick={() =>
                      setModal({ kind: "status", filter: "healthy" })
                    }
                    type="button"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span className="text-xs font-medium">{healthyCount}</span>
                  </button>
                )}
                {warningCount > 0 && (
                  <button
                    className="hover:bg-muted/60 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
                    onClick={() =>
                      setModal({ kind: "status", filter: "warning" })
                    }
                    type="button"
                  >
                    <TriangleAlert className="size-3.5 text-amber-500" />
                    <span className="text-xs font-medium">{warningCount}</span>
                  </button>
                )}
                {criticalCount > 0 && (
                  <button
                    className="hover:bg-muted/60 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
                    onClick={() =>
                      setModal({ kind: "status", filter: "critical" })
                    }
                    type="button"
                  >
                    <XCircle className="size-3.5 text-red-500" />
                    <span className="text-xs font-medium">{criticalCount}</span>
                  </button>
                )}
              </div>

              <button
                className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-75 ${
                  readyToDeploy
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                }`}
                onClick={() =>
                  setModal({
                    kind: "status",
                    filter: readyToDeploy ? "healthy" : "critical",
                  })
                }
                type="button"
              >
                {readyToDeploy ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <XCircle className="size-3" />
                )}
                {readyToDeploy ? "Deploy ready" : "Issues found"}
              </button>
            </div>
          </div>

          {/* Right — section rows, each clickable */}
          <div className="flex flex-col justify-center divide-y divide-border/30 py-1">
            {sections.map((section) => (
              <button
                className="hover:bg-muted/30 flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
                key={section.title}
                onClick={() =>
                  setModal({ kind: "section", sectionTitle: section.title })
                }
                type="button"
              >
                <span className="text-muted-foreground text-xs">
                  {section.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusIcon status={section.status} />
                  <span
                    className={`text-xs font-medium ${statusColor[section.status]}`}
                  >
                    {statusText[section.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[55vh] space-y-4 overflow-y-auto">
            {modalSections.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No checks in this category.
              </p>
            ) : (
              modalSections.map((sec) => (
                <div className="space-y-2" key={sec.title}>
                  {modalSections.length > 1 && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {sec.title}
                    </p>
                  )}
                  {sec.checks.map((check) => (
                    <CheckRow check={check} key={check.id} />
                  ))}
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
