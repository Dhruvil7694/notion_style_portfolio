"use client"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import type {
  JobFitComparisonMatrix,
  SkillMatchStatus,
} from "@/lib/public/job-fit-comparison-matrix"
import { buildJobFitComparisonMatrix } from "@/lib/public/job-fit-comparison-matrix"
import type { JobFitHistoryEntry } from "@/lib/public/job-fit-history"
import { cn } from "@/lib/utils"
import { trapNestedScrollWheel } from "@/lib/utils/trap-nested-scroll-wheel"

type MatrixTableProps = {
  matrix: JobFitComparisonMatrix
  variant?: "compact" | "fullscreen"
}

function statusLabel(status: SkillMatchStatus): string {
  if (status === "strong") return "Strong"
  if (status === "partial") return "Partial"
  return "Gap"
}

function statusClass(status: SkillMatchStatus, isDarkTheme: boolean): string {
  if (status === "strong") {
    return isDarkTheme ? "text-green-400" : "text-foreground"
  }
  if (status === "partial") {
    return "text-foreground/70"
  }
  return "text-muted-foreground/60"
}

export function MatrixTable({ matrix, variant = "compact" }: MatrixTableProps) {
  const { theme } = useSiteTheme()
  const isDarkTheme = theme === "dark"
  const multiRole = matrix.roles.length > 1
  const isFullscreen = variant === "fullscreen"
  const surfaceClass = "bg-background"

  return (
    <div
      className={cn(
        isFullscreen
          ? "max-h-none overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "overflow-visible"
      )}
      data-lenis-prevent={isFullscreen ? true : undefined}
      onWheel={isFullscreen ? trapNestedScrollWheel : undefined}
    >
      <table
        className={cn(
          "w-full min-w-[280px] text-left",
          isFullscreen ? "text-[12px]" : "text-[10px]"
        )}
      >
        <thead className={cn("sticky top-0 z-10", surfaceClass)}>
          <tr className="border-b border-border/50 text-muted-foreground/70">
            <th className={cn("px-2 py-2 font-medium", surfaceClass)}>Skill</th>
            {multiRole ? (
              matrix.roles.map((role) => (
                <th
                  key={role.id}
                  className={cn(
                    "max-w-[120px] px-2 py-2 font-medium",
                    surfaceClass
                  )}
                >
                  <span className={cn(isFullscreen ? "" : "line-clamp-2")}>
                    {role.title}
                  </span>
                  <span className="mt-0.5 block font-normal tabular-nums text-foreground/80">
                    {role.fitScoreLabel}
                  </span>
                </th>
              ))
            ) : (
              <>
                <th className={cn("w-16 px-2 py-2 font-medium", surfaceClass)}>
                  Match
                </th>
                <th className={cn("px-2 py-2 font-medium", surfaceClass)}>
                  Evidence
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className={surfaceClass}>
          {matrix.rows.length === 0 ? (
            <tr>
              <td
                className="px-2 py-3 text-muted-foreground/55"
                colSpan={multiRole ? matrix.roles.length + 1 : 3}
              >
                No skill breakdown available for this comparison.
              </td>
            </tr>
          ) : (
            matrix.rows.map((row) => {
              const singleCell = matrix.roles[0]
                ? row.cells[matrix.roles[0].id]
                : null

              return (
                <tr
                  key={row.skill}
                  className="border-b border-border/30 align-top last:border-b-0"
                >
                  <td className="px-2 py-2 font-medium text-foreground/85">
                    {row.skill}
                  </td>
                  {multiRole ? (
                    matrix.roles.map((role) => {
                      const cell = row.cells[role.id]
                      return (
                        <td key={role.id} className="px-2 py-2">
                          {cell ? (
                            <div>
                              <p
                                className={cn(
                                  "font-medium",
                                  statusClass(cell.status, isDarkTheme)
                                )}
                              >
                                {statusLabel(cell.status)}
                              </p>
                              {cell.detail ? (
                                <p
                                  className={cn(
                                    "mt-0.5 text-muted-foreground/60",
                                    !isFullscreen && "line-clamp-3"
                                  )}
                                >
                                  {cell.detail}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/35">—</span>
                          )}
                        </td>
                      )
                    })
                  ) : (
                    <>
                      <td className="px-2 py-2">
                        {singleCell ? (
                          <span
                            className={cn(
                              "font-medium",
                              statusClass(singleCell.status, isDarkTheme)
                            )}
                          >
                            {statusLabel(singleCell.status)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/35">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground/60">
                        {singleCell?.detail ?? "—"}
                      </td>
                    </>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

type JobFitHistoryMatrixTableProps = {
  entries: JobFitHistoryEntry[]
}

export function JobFitHistoryMatrixTable({
  entries,
}: JobFitHistoryMatrixTableProps) {
  const matrix = buildJobFitComparisonMatrix(entries)
  if (!matrix) return null

  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-background">
      <MatrixTable matrix={matrix} variant="compact" />
    </div>
  )
}

export function buildMatrixFromEntries(
  entries: JobFitHistoryEntry[]
): JobFitComparisonMatrix | null {
  return buildJobFitComparisonMatrix(entries)
}
