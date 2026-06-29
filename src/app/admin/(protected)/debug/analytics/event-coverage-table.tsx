"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import type { EventValidationResult } from "@/shared/lib/debug/posthog-validation"

const PER_PAGE = 8

const EVENT_META: Record<string, { category: string; description: string }> = {
  project_view: {
    category: "Content",
    description: "User viewed a portfolio project detail page",
  },
  research_view: {
    category: "Content",
    description: "User opened a research article",
  },
  article_view: {
    category: "Content",
    description: "User opened a blog article",
  },
  automation_view: {
    category: "Content",
    description: "User viewed an automation case study",
  },
  expertise_view: {
    category: "Content",
    description: "User explored an expertise domain",
  },
  technology_view: {
    category: "Content",
    description: "User viewed a technology knowledge page",
  },
  faq_expand: {
    category: "Engagement",
    description: "User expanded an FAQ accordion item",
  },
  contact_click: {
    category: "Engagement",
    description: "User clicked a contact link or button",
  },
  resume_download: {
    category: "Engagement",
    description: "User downloaded the resume PDF",
  },
  search_opened: {
    category: "Search",
    description: "User opened the global search modal",
  },
  search_query: {
    category: "Search",
    description: "User typed a search query",
  },
  search_result_click: {
    category: "Search",
    description: "User clicked a search result",
  },
  assistant_opened: {
    category: "AI",
    description: "User opened the AI assistant panel",
  },
  assistant_question: {
    category: "AI",
    description: "User sent a question to the AI assistant",
  },
  assistant_source_click: {
    category: "AI",
    description: "User clicked a source link in AI response",
  },
  assistant_job_fit_mode: {
    category: "AI",
    description: "User entered job-fit analysis mode",
  },
  assistant_job_fit: {
    category: "AI",
    description: "User ran a job-fit analysis on a JD",
  },
  jd_classification_feedback: {
    category: "AI",
    description: "User gave feedback on a JD classification result",
  },
  copilot_opened: {
    category: "AI",
    description: "User opened the Copilot agent panel",
  },
  copilot_tool_invoked: {
    category: "AI",
    description: "Copilot invoked an internal tool (search, generation, etc.)",
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  Content: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Engagement: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Search: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  AI: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

function formatLastSeen(ts: string | null): string {
  if (!ts) return "—"
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ts
  }
}

function StatusBadge({ status }: { status: EventValidationResult["status"] }) {
  if (status === "pass")
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        LIVE
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
      NO DATA
    </span>
  )
}

export function EventCoverageTable({
  results,
}: {
  results: EventValidationResult[]
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(results.length / PER_PAGE)
  const slice = results.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_6rem_7rem_8rem_10rem] gap-4 bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span>Event</span>
          <span>Category</span>
          <span className="text-right">Count (30d)</span>
          <span>Status</span>
          <span>Last seen</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/60">
          {slice.map((r) => {
            const meta = EVENT_META[r.event] ?? {
              category: "Other",
              description: r.event,
            }
            const catColor =
              CATEGORY_COLORS[meta.category] ??
              "bg-muted/50 text-muted-foreground"
            return (
              <div
                className="grid grid-cols-[1fr_6rem_7rem_8rem_10rem] items-start gap-4 px-4 py-3"
                key={r.event}
              >
                {/* Event + description */}
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-mono text-xs font-medium">
                    {r.event}
                  </p>
                  <p className="text-muted-foreground truncate text-xs leading-snug">
                    {meta.description}
                  </p>
                </div>

                {/* Category badge */}
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${catColor}`}
                  >
                    {meta.category}
                  </span>
                </div>

                {/* Count */}
                <div className="pt-0.5 text-right">
                  <span className="text-sm font-semibold tabular-nums">
                    {r.count > 0 ? r.count.toLocaleString() : "—"}
                  </span>
                </div>

                {/* Status */}
                <div className="pt-0.5">
                  <StatusBadge status={r.status} />
                </div>

                {/* Last seen */}
                <div className="pt-0.5">
                  <span className="text-muted-foreground text-xs">
                    {formatLastSeen(r.lastSeen)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Showing {page * PER_PAGE + 1}–
            {Math.min((page + 1) * PER_PAGE, results.length)} of{" "}
            {results.length} events
          </p>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md border border-border/60 p-1.5 text-muted-foreground hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40 transition-colors"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                  i === page
                    ? "bg-foreground text-background"
                    : "border border-border/60 text-muted-foreground hover:bg-muted/60"
                }`}
                key={i}
                onClick={() => setPage(i)}
                type="button"
              >
                {i + 1}
              </button>
            ))}
            <button
              className="rounded-md border border-border/60 p-1.5 text-muted-foreground hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40 transition-colors"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
