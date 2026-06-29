"use client"

import {
  CheckCircle2,
  CirclePlay,
  ExternalLink,
  Play,
  SkipForward,
  TriangleAlert,
  XCircle,
} from "lucide-react"
import { useState } from "react"

import {
  AdminDataTable,
  AdminPanel,
} from "@/features/admin/components/admin-panel"
import { PageHeader } from "@/features/admin/components/page-header"
import { Button } from "@/shared/ui/button"

// ─── Sentry project constants ──────────────────────────────────────────────────

const SENTRY_ORG = "quantro-zc"
const SENTRY_PROJECT = "notion-portfolio"
const SENTRY_BASE = `https://${SENTRY_ORG}.sentry.io`
const SENTRY_PROJECT_URL = `${SENTRY_BASE}/projects/${SENTRY_PROJECT}/`
const SENTRY_ISSUES_URL = `${SENTRY_BASE}/issues/?project=${SENTRY_PROJECT}&query=tags%5Btest%5D%3Atrue`

function sentryEventUrl(eventId: string) {
  return `${SENTRY_BASE}/issues/?query=${eventId}`
}

// ─── types ────────────────────────────────────────────────────────────────────

type TestType =
  | "public-page-error"
  | "route-handler-error"
  | "assistant-error"
  | "copilot-error"
  | "server-action-error"

type TestResult = {
  type: TestType
  status: "pass" | "fail" | "skipped"
  eventId: string | null
  requestId?: string
  error?: string
  skipped?: boolean
  reason?: string
  ts: number
}

const TESTS: { type: TestType; label: string; description: string }[] = [
  {
    type: "public-page-error",
    label: "Public Page Error",
    description: "Simulates a React render error on a public page",
  },
  {
    type: "route-handler-error",
    label: "Route Handler Error",
    description: "Simulates an error thrown in /api/chat route handler",
  },
  {
    type: "assistant-error",
    label: "Assistant Error",
    description: "Simulates a stream failure in the AI assistant layer",
  },
  {
    type: "copilot-error",
    label: "Copilot Error",
    description: "Simulates an error thrown in the copilot agent",
  },
  {
    type: "server-action-error",
    label: "Server Action Error",
    description: "Simulates an error from a CMS server action",
  },
]

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TestResult["status"] }) {
  if (status === "pass")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> PASS
      </span>
    )
  if (status === "skipped")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <SkipForward className="size-3" /> SKIPPED
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
      <XCircle className="size-3" /> FAIL
    </span>
  )
}

// ─── summary panel ────────────────────────────────────────────────────────────

function SummaryPanel({
  results,
}: {
  results: Record<TestType, TestResult | null>
}) {
  const allResults = TESTS.map((t) => results[t.type]).filter(
    Boolean
  ) as TestResult[]
  const passed = allResults.filter((r) => r.status === "pass").length
  const failed = allResults.filter((r) => r.status === "fail").length
  const skipped = allResults.filter((r) => r.status === "skipped").length
  const ran = allResults.length
  const total = TESTS.length
  const allDone = ran === total

  const dsnConfigured =
    typeof window !== "undefined" ? !!process.env.NEXT_PUBLIC_SENTRY_DSN : false

  const capturedEvents = allResults
    .filter((r) => r.eventId)
    .map((r) => ({ type: r.type, eventId: r.eventId! }))

  const passRate = total === 0 ? 0 : Math.round((passed / total) * 100)

  return (
    <AdminPanel className="flex h-full flex-col" title="Summary">
      <div className="flex flex-1 flex-col gap-5">
        {/* Stat chips */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Total",
              value: total,
              color: "text-foreground",
              bg: "bg-muted/50",
            },
            {
              label: "Passed",
              value: passed,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: passed > 0 ? "bg-emerald-500/8" : "bg-muted/50",
            },
            {
              label: "Failed",
              value: failed,
              color:
                failed > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground",
              bg: failed > 0 ? "bg-red-500/8" : "bg-muted/50",
            },
            {
              label: "Skipped",
              value: skipped,
              color:
                skipped > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              bg: skipped > 0 ? "bg-amber-500/8" : "bg-muted/50",
            },
          ].map(({ label, value, color, bg }) => (
            <div className={`rounded-lg px-3 py-3 ${bg}`} key={label}>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                {label}
              </p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Pass-rate bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Pass rate
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                ran === 0
                  ? "text-muted-foreground"
                  : failed > 0
                    ? "text-red-500"
                    : "text-emerald-500"
              }`}
            >
              {ran === 0 ? "—" : `${passRate}%`}
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                failed > 0
                  ? "bg-red-500"
                  : ran === 0
                    ? "bg-muted-foreground/20"
                    : "bg-emerald-500"
              }`}
              style={{ width: ran === 0 ? "0%" : `${passRate}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {ran === 0
              ? "Run tests to see results"
              : allDone
                ? `${passed} of ${total} tests passed`
                : `${ran} of ${total} complete…`}
          </p>
        </div>

        {/* Sentry project info */}
        <div className="divide-border/60 divide-y rounded-lg border border-border/60">
          {[
            { label: "Organisation", value: SENTRY_ORG },
            { label: "Project", value: SENTRY_PROJECT },
            {
              label: "DSN",
              value: dsnConfigured ? "Configured" : "Not set",
              valueClass: dsnConfigured
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Environment",
              value: process.env.NODE_ENV ?? "unknown",
            },
          ].map(({ label, value, valueClass }) => (
            <div
              className="flex items-center justify-between px-3 py-2.5"
              key={label}
            >
              <span className="text-muted-foreground text-sm">{label}</span>
              <span
                className={`font-mono text-sm ${valueClass ?? "text-foreground"}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Captured event IDs */}
        {capturedEvents.length > 0 ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Captured events
            </p>
            <div className="flex flex-wrap gap-2">
              {capturedEvents.map(({ type, eventId }) => (
                <a
                  className="border-border/60 hover:bg-muted/60 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors"
                  href={sentryEventUrl(eventId)}
                  key={type}
                  rel="noopener noreferrer"
                  target="_blank"
                  title={type}
                >
                  {eventId.slice(0, 8)}
                  <ExternalLink className="size-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
            <CirclePlay className="text-muted-foreground/40 size-8" />
            <p className="text-muted-foreground text-sm">
              Run tests to capture Sentry event IDs
            </p>
          </div>
        )}

        {/* Warnings */}
        {skipped > 0 && (
          <div className="bg-amber-500/8 border-amber-500/20 flex items-start gap-2.5 rounded-lg border px-3.5 py-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {skipped} test{skipped !== 1 ? "s" : ""} skipped — DSN not
                configured
              </p>
              <a
                className="text-sm text-amber-700/70 underline-offset-2 hover:underline dark:text-amber-400/70"
                href="https://vercel.com/dashboard"
                rel="noopener noreferrer"
                target="_blank"
              >
                Add NEXT_PUBLIC_SENTRY_DSN in Vercel →
              </a>
            </div>
          </div>
        )}

        {passed > 0 && (
          <a
            className="text-muted-foreground hover:text-foreground mt-auto inline-flex items-center gap-1.5 text-sm transition-colors"
            href={SENTRY_ISSUES_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3.5" />
            View captured events in Sentry
          </a>
        )}
      </div>
    </AdminPanel>
  )
}

// ─── after steps panel ────────────────────────────────────────────────────────

function StepLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="border-border/60 hover:bg-muted/60 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="truncate">{label}</span>
      <ExternalLink className="size-3.5 shrink-0 opacity-50" />
    </a>
  )
}

function AfterStepsPanel({
  hasResults,
  hasSkipped,
}: {
  hasResults: boolean
  hasSkipped: boolean
}) {
  type StepStatus = "done" | "warn" | "idle"

  const steps: {
    num: string
    title: string
    description: React.ReactNode
    links: { href: string; label: string }[]
    status: StepStatus
  }[] = [
    {
      num: "01",
      title: "Open Sentry Issues",
      description: (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Filter by tag{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            test:true
          </code>{" "}
          to see only events fired from this debug page.
        </p>
      ),
      links: [{ href: SENTRY_ISSUES_URL, label: "Open in Sentry" }],
      status: hasResults ? "done" : "idle",
    },
    {
      num: "02",
      title: "Verify events",
      description: (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Event IDs in the Summary link directly to Sentry. Confirm stack trace
          and route tag are correct.
        </p>
      ),
      links: [{ href: SENTRY_PROJECT_URL, label: "Open project" }],
      status: hasResults ? "done" : "idle",
    },
    {
      num: "03",
      title: hasSkipped ? "Configure DSN — required" : "Configure DSN",
      description: (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Add{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SENTRY_DSN
          </code>{" "}
          to your env if any tests were skipped.
        </p>
      ),
      links: [
        { href: "https://vercel.com/dashboard", label: "Vercel settings" },
        { href: `${SENTRY_PROJECT_URL}keys/`, label: "Get DSN" },
      ],
      status: hasSkipped ? "warn" : "idle",
    },
  ]

  const statusStyles: Record<
    StepStatus,
    { num: string; border: string; title: string }
  > = {
    done: {
      num: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20 bg-emerald-500/3",
      title: "text-foreground",
    },
    warn: {
      num: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20 bg-amber-500/3",
      title: "text-amber-700 dark:text-amber-400",
    },
    idle: {
      num: "bg-muted text-muted-foreground",
      border: "border-border/50",
      title: "text-foreground",
    },
  }

  return (
    <AdminPanel className="flex h-full flex-col" title="After running tests">
      <ol className="flex flex-1 flex-col gap-2.5">
        {steps.map((step) => {
          const s = statusStyles[step.status]
          return (
            <li
              className={`flex flex-1 flex-col justify-center rounded-lg border px-3.5 py-3.5 transition-colors hover:bg-muted/30 ${s.border}`}
              key={step.num}
            >
              {/* 70 / 30 split */}
              <div className="flex items-start gap-3">
                {/* Left 70% — number + title + description */}
                <div className="flex min-w-0 flex-[7] items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-8 shrink-0 items-center justify-center rounded text-xs font-bold tabular-nums ${s.num}`}
                  >
                    {step.num}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <p
                      className={`text-sm font-semibold leading-tight ${s.title}`}
                    >
                      {step.title}
                    </p>
                    {step.description}
                  </div>
                </div>

                {/* Right 30% — action links stacked, right-aligned */}
                <div className="flex flex-[3] flex-col items-end gap-1.5">
                  {step.links.map((link) => (
                    <StepLink
                      href={link.href}
                      key={link.href}
                      label={link.label}
                    />
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </AdminPanel>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SentryDebugPage() {
  const [results, setResults] = useState<Record<TestType, TestResult | null>>(
    {} as Record<TestType, TestResult | null>
  )
  const [running, setRunning] = useState<TestType | null>(null)
  const [runningAll, setRunningAll] = useState(false)

  async function runTest(type: TestType): Promise<TestResult> {
    const res = await fetch("/api/debug/sentry-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
    const data = (await res.json()) as {
      eventId?: string | null
      requestId?: string
      skipped?: boolean
      reason?: string
      error?: string
      type?: TestType
    }

    if (!res.ok) {
      return {
        type,
        status: "fail",
        eventId: null,
        error: data.error ?? "Request failed",
        ts: Date.now(),
      }
    }
    if (data.skipped) {
      return {
        type,
        status: "skipped",
        eventId: null,
        reason: data.reason,
        ts: Date.now(),
      }
    }
    return {
      type,
      status: data.eventId ? "pass" : "fail",
      eventId: data.eventId ?? null,
      requestId: data.requestId,
      error: data.eventId ? undefined : "No event ID returned",
      ts: Date.now(),
    }
  }

  async function handleRunOne(type: TestType) {
    setRunning(type)
    try {
      const result = await runTest(type)
      setResults((prev) => ({ ...prev, [type]: result }))
    } finally {
      setRunning(null)
    }
  }

  async function handleRunAll() {
    setRunningAll(true)
    for (const { type } of TESTS) {
      setRunning(type)
      const result = await runTest(type)
      setResults((prev) => ({ ...prev, [type]: result }))
    }
    setRunning(null)
    setRunningAll(false)
  }

  const allResults = TESTS.map((t) => results[t.type]).filter(
    Boolean
  ) as TestResult[]
  const hasSkipped = allResults.some((r) => r.status === "skipped")
  const hasResults = allResults.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <a
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
            href={SENTRY_PROJECT_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden className="size-3.5" />
            {SENTRY_ORG} / {SENTRY_PROJECT}
          </a>
        }
        description="Fire real Sentry events to verify monitoring is active. Each test captures a real exception with stack trace, route info, and environment."
        title="Sentry Validation"
      />

      {/* Summary + Verification steps — always visible 2-col */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryPanel results={results} />
        <AfterStepsPanel hasResults={hasResults} hasSkipped={hasSkipped} />
      </div>

      <AdminPanel
        actions={
          <Button
            disabled={runningAll || running !== null}
            onClick={handleRunAll}
            size="sm"
            type="button"
            variant="outline"
          >
            <CirclePlay aria-hidden className="size-4" />
            {runningAll ? "Running all…" : "Run all tests"}
          </Button>
        }
        description="Fire test exceptions and verify they appear in Sentry."
        title="Tests"
      >
        <AdminDataTable>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/50 text-left">
                <th className="px-4 py-2 font-medium">Test</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Event ID</th>
                <th className="px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {TESTS.map(({ type, label, description }) => {
                const result = results[type]
                const isRunning = running === type
                return (
                  <tr
                    className="border-border border-b last:border-0"
                    key={type}
                  >
                    <td className="px-4 py-3 font-medium">{label}</td>
                    <td className="text-muted-foreground px-4 py-3">
                      {description}
                    </td>
                    <td className="px-4 py-3">
                      {result ? (
                        <StatusBadge status={result.status} />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {result?.eventId ? (
                        <a
                          className="inline-flex items-center gap-1 text-emerald-700 transition-opacity hover:opacity-70 dark:text-emerald-400"
                          href={sentryEventUrl(result.eventId)}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {result.eventId}
                          <ExternalLink className="size-2.5 shrink-0" />
                        </a>
                      ) : result?.reason ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {result.reason}
                        </span>
                      ) : result?.error ? (
                        <span className="text-red-600 dark:text-red-400">
                          {result.error}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        disabled={isRunning || runningAll}
                        onClick={() => handleRunOne(type)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Play aria-hidden className="size-4" />
                        {isRunning ? "Running…" : "Run"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </AdminDataTable>
      </AdminPanel>
    </div>
  )
}
