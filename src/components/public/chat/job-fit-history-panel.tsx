"use client"

import {
  ChevronDown,
  LayoutGrid,
  List,
  Maximize2,
  PieChart,
  X,
} from "lucide-react"
import { Fragment, useState } from "react"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import { buildJobFitComparisonMatrix } from "@/lib/public/job-fit-comparison-matrix"
import type { JobFitHistoryEntry } from "@/lib/public/job-fit-history"
import { parseJobFitAnalysisDetailed } from "@/lib/public/parse-job-fit-result"
import { cn } from "@/lib/utils"

import { JobFitComparisonModal } from "./job-fit-comparison-modal"
import { JobFitExportPdfButton } from "./job-fit-export-pdf-button"
import {
  JobFitHistoryCompareNote,
  JobFitHistoryDetail,
} from "./job-fit-history-detail"
import { JobFitHistoryMatrixTable } from "./job-fit-history-matrix"
import { JobFitSkillChart } from "./job-fit-skill-chart"

type JobFitHistoryPanelProps = {
  entries: JobFitHistoryEntry[]
  onRemoveEntry: (entryId: string) => void
  onClearAll: () => void
}

type ViewMode = "list" | "table" | "chart"

function scoreTone(
  score: number,
  bestScore: number,
  isDarkTheme: boolean
): string {
  if (score < bestScore) return "text-muted-foreground/70"
  return isDarkTheme ? "text-green-400" : "text-foreground"
}

function skillCounts(entry: JobFitHistoryEntry): string {
  const detail = parseJobFitAnalysisDetailed(entry.analysisMarkdown)
  if (!detail) return ""

  return `${detail.strongMatches.length} strong · ${detail.partialMatches.length} partial · ${detail.growthAreas.length} gaps`
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div className="flex rounded-lg border border-border/40 p-0.5">
      <button
        aria-pressed={mode === "list"}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] transition-colors",
          mode === "list"
            ? "bg-muted/60 text-foreground"
            : "text-muted-foreground/55 hover:text-muted-foreground"
        )}
        onClick={() => onChange("list")}
        type="button"
      >
        <List className="size-3" />
        List
      </button>
      <button
        aria-pressed={mode === "table"}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] transition-colors",
          mode === "table"
            ? "bg-muted/60 text-foreground"
            : "text-muted-foreground/55 hover:text-muted-foreground"
        )}
        onClick={() => onChange("table")}
        type="button"
      >
        <LayoutGrid className="size-3" />
        Table
      </button>
      <button
        aria-pressed={mode === "chart"}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] transition-colors",
          mode === "chart"
            ? "bg-muted/60 text-foreground"
            : "text-muted-foreground/55 hover:text-muted-foreground"
        )}
        onClick={() => onChange("chart")}
        type="button"
      >
        <PieChart className="size-3" />
        Chart
      </button>
    </div>
  )
}

export function JobFitHistoryPanel({
  entries,
  onRemoveEntry,
  onClearAll,
}: JobFitHistoryPanelProps) {
  const { theme } = useSiteTheme()
  const isDarkTheme = theme === "dark"
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true)

  if (entries.length === 0) return null

  const bestScore = Math.max(...entries.map((entry) => entry.fitScore))
  const compareMode = entries.length > 1
  const comparisonMatrix = buildJobFitComparisonMatrix(entries)

  return (
    <div className="mb-2.5 rounded-xl border border-border/50 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          aria-expanded={!isPanelCollapsed}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={() => setIsPanelCollapsed((current) => !current)}
          type="button"
        >
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground/50 transition-transform",
              isPanelCollapsed && "-rotate-90"
            )}
          />
          <p className="text-[11px] font-medium text-foreground/85">
            {compareMode ? "Role comparison" : "Fit score"}
          </p>
          {isPanelCollapsed ? (
            <span className="truncate text-[10px] text-muted-foreground/50">
              · {entries.length} role{entries.length === 1 ? "" : "s"}
              {compareMode
                ? ` · best ${entries.find((e) => e.fitScore === bestScore)?.fitScoreLabel ?? ""}`
                : ` · ${entries[0]?.fitScoreLabel ?? ""}`}
            </span>
          ) : null}
        </button>
        {!isPanelCollapsed ? (
          <div className="flex items-center gap-2">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            {viewMode === "table" && comparisonMatrix ? (
              <button
                aria-label="Expand comparison table"
                className="flex size-6 items-center justify-center rounded-md border border-border/40 text-muted-foreground/55 transition-colors hover:bg-muted/40 hover:text-foreground"
                onClick={() => setComparisonModalOpen(true)}
                title="Expand comparison"
                type="button"
              >
                <Maximize2 className="size-3" />
              </button>
            ) : null}
            <span className="text-[10px] text-muted-foreground/50">
              {entries.length}/5
            </span>
            <button
              className="text-[10px] text-muted-foreground/55 underline-offset-2 hover:text-muted-foreground hover:underline"
              onClick={onClearAll}
              type="button"
            >
              Clear all
            </button>
          </div>
        ) : (
          <span className="shrink-0 text-[10px] text-muted-foreground/50">
            {entries.length}/5
          </span>
        )}
      </div>

      {!isPanelCollapsed ? (
        <div className="mt-2">
          {compareMode && viewMode === "list" ? (
            <JobFitHistoryCompareNote entries={entries} />
          ) : null}

          {viewMode === "table" ? (
            <JobFitHistoryMatrixTable entries={entries} />
          ) : viewMode === "chart" ? (
            <JobFitSkillChart entries={entries} variant="panel" />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/40">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground/60">
                    <th className="px-2.5 py-1.5 font-medium">Role</th>
                    <th className="w-16 px-2 py-1.5 text-right font-medium">
                      Score
                    </th>
                    <th className="w-7 px-1 py-1.5" aria-label="Export" />
                    <th className="w-7 px-1 py-1.5" aria-label="Remove" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isExpanded = expandedId === entry.id
                    const counts = skillCounts(entry)

                    return (
                      <Fragment key={entry.id}>
                        <tr
                          className={cn(
                            "border-b border-border/30",
                            isExpanded && "border-b-0"
                          )}
                        >
                          <td className="max-w-[0] px-2.5 py-1.5">
                            <button
                              className="flex w-full min-w-0 items-center gap-1 text-left"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : entry.id)
                              }
                              type="button"
                            >
                              <ChevronDown
                                className={cn(
                                  "size-3 shrink-0 text-muted-foreground/45 transition-transform",
                                  isExpanded && "rotate-180"
                                )}
                              />
                              <span className="min-w-0 truncate text-foreground/80">
                                {entry.roleTitle}
                              </span>
                            </button>
                            {counts ? (
                              <p className="mt-0.5 truncate pl-4 text-[9px] text-muted-foreground/45">
                                {counts}
                              </p>
                            ) : null}
                          </td>
                          <td
                            className={cn(
                              "px-2 py-1.5 text-right font-medium tabular-nums",
                              scoreTone(entry.fitScore, bestScore, isDarkTheme)
                            )}
                          >
                            {entry.fitScoreLabel}
                            {compareMode && entry.fitScore === bestScore ? (
                              <span className="ml-1 text-[9px] font-normal text-muted-foreground/50">
                                best
                              </span>
                            ) : null}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <JobFitExportPdfButton
                              analysisMarkdown={entry.analysisMarkdown}
                              variant="icon"
                            />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              aria-label={`Remove ${entry.roleTitle}`}
                              className="inline-flex size-5 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                              onClick={() => onRemoveEntry(entry.id)}
                              type="button"
                            >
                              <X className="size-3" />
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-b border-border/30 last:border-b-0">
                            <td className="p-0" colSpan={4}>
                              <JobFitHistoryDetail entry={entry} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/45">
            {viewMode === "table"
              ? "Skills across roles — expand for full-screen comparison."
              : viewMode === "chart"
                ? "Radar and bar charts from parsed skill tables."
                : "Tap a role for skills & evidence."}{" "}
            Saved in your browser only.
          </p>
        </div>
      ) : null}

      {comparisonModalOpen && comparisonMatrix ? (
        <JobFitComparisonModal
          matrix={comparisonMatrix}
          onClose={() => setComparisonModalOpen(false)}
        />
      ) : null}
    </div>
  )
}
