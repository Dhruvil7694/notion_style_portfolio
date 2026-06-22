"use client"

import { useState } from "react"

import { PageHeader } from "@/components/admin"

export const metadata = undefined

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

function StatusBadge({ status }: { status: TestResult["status"] }) {
  if (status === "pass")
    return (
      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
        PASS
      </span>
    )
  if (status === "skipped")
    return (
      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        SKIPPED
      </span>
    )
  return (
    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      FAIL
    </span>
  )
}

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
  const passed = allResults.filter((r) => r.status === "pass").length
  const failed = allResults.filter((r) => r.status === "fail").length
  const skipped = allResults.filter((r) => r.status === "skipped").length

  return (
    <div className="space-y-8">
      <PageHeader
        description="Fire real Sentry events to verify monitoring is active. Each test captures a real exception with stack trace, route info, and environment."
        title="Sentry Validation"
      />

      {allResults.length > 0 && (
        <section className="rounded-lg border p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-semibold">Summary</span>
            <span className="text-green-600 dark:text-green-400">
              ✓ {passed} passed
            </span>
            {failed > 0 && (
              <span className="text-red-600 dark:text-red-400">
                ✗ {failed} failed
              </span>
            )}
            {skipped > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                ⚠ {skipped} skipped (DSN not set)
              </span>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Tests</h2>
          <button
            className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            disabled={runningAll || running !== null}
            onClick={handleRunAll}
            type="button"
          >
            {runningAll ? "Running all…" : "Run All Tests"}
          </button>
        </div>

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
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
                  <tr className="border-b last:border-0" key={type}>
                    <td className="px-4 py-3 font-medium">{label}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {description}
                    </td>
                    <td className="px-4 py-3">
                      {result ? (
                        <StatusBadge status={result.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {result?.eventId ? (
                        <span className="text-green-700 dark:text-green-400">
                          {result.eventId}
                        </span>
                      ) : result?.reason ? (
                        <span className="text-yellow-600 dark:text-yellow-400">
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
                      <button
                        className="rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                        disabled={isRunning || runningAll}
                        onClick={() => handleRunOne(type)}
                        type="button"
                      >
                        {isRunning ? "Running…" : "Run"}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">After running tests:</p>
        <p>
          1. Open Sentry → Issues → filter by tag <code>test:true</code>
        </p>
        <p>
          2. Verify each event ID appears with correct stack trace and route tag
        </p>
        <p>
          3. Skipped = SENTRY_DSN not set in environment — add it in Vercel
          settings
        </p>
      </section>
    </div>
  )
}
