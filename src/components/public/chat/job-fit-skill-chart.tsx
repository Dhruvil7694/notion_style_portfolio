"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import type { JobFitHistoryEntry } from "@/lib/public/job-fit-history"
import {
  buildMultiRoleRadarData,
  buildRoleStackBarData,
  buildSkillRadarData,
  buildSummaryBarData,
  hasSkillChartData,
  type SummaryBarPoint,
} from "@/lib/public/job-fit-skill-chart"
import { parseJobFitAnalysisDetailed } from "@/lib/public/parse-job-fit-result"
import { cn } from "@/lib/utils"

type ChartVariant = "compact" | "panel"
type ChartLayout = "full" | "summary"

type JobFitSkillChartProps = {
  entries: JobFitHistoryEntry[]
  variant?: ChartVariant
  layout?: ChartLayout
  className?: string
}

function useChartColors() {
  const { theme } = useSiteTheme()
  const isDarkTheme = theme === "dark"

  return useMemo(
    () => ({
      isDarkTheme,
      strong: isDarkTheme ? "#4ade80" : "var(--foreground)",
      partial: isDarkTheme
        ? "color-mix(in srgb, var(--foreground) 72%, transparent)"
        : "color-mix(in srgb, var(--foreground) 70%, transparent)",
      gap: "color-mix(in srgb, var(--muted-foreground) 65%, transparent)",
      roleColors: isDarkTheme
        ? ["#60a5fa", "#4ade80", "#fbbf24", "#f472b6", "#a78bfa"]
        : ["var(--foreground)", "#6366f1", "#0d9488", "#d97706", "#7c3aed"],
      tooltipStyle: {
        backgroundColor: "var(--background)",
        border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
        borderRadius: "8px",
        fontSize: "11px",
        color: "var(--foreground)",
      },
      gridStroke: "color-mix(in srgb, var(--border) 40%, transparent)",
      tickFill: "var(--muted-foreground)",
    }),
    [isDarkTheme]
  )
}

function statusColor(
  status: SummaryBarPoint["status"],
  colors: ReturnType<typeof useChartColors>
): string {
  if (status === "strong") return colors.strong
  if (status === "partial") return colors.partial
  return colors.gap
}

function SummaryBarChart({
  entries,
  height,
}: {
  entries: JobFitHistoryEntry[]
  height: number
}) {
  const colors = useChartColors()
  const compareMode = entries.length > 1

  if (compareMode) {
    const data = buildRoleStackBarData(entries)
    if (data.length === 0) return null

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
          <XAxis
            dataKey="role"
            tick={{ fontSize: 10, fill: colors.tickFill }}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: colors.tickFill }}
          />
          <Tooltip contentStyle={colors.tooltipStyle} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
          <Bar
            dataKey="strong"
            name="Strong"
            stackId="match"
            fill={colors.strong}
            fillOpacity={0.9}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="partial"
            name="Partial"
            stackId="match"
            fill={colors.partial}
            fillOpacity={0.85}
          />
          <Bar
            dataKey="gap"
            name="Gaps"
            stackId="match"
            fill={colors.gap}
            fillOpacity={0.85}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const detail = parseJobFitAnalysisDetailed(entries[0]?.analysisMarkdown ?? "")
  if (!detail || !hasSkillChartData(detail)) return null

  const data = buildSummaryBarData(detail)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 10, fill: colors.tickFill }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: colors.tickFill }}
        />
        <Tooltip contentStyle={colors.tooltipStyle} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((point) => (
            <Cell
              key={point.category}
              fill={statusColor(point.status, colors)}
              fillOpacity={0.9}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function SkillRadarChart({
  entries,
  height,
}: {
  entries: JobFitHistoryEntry[]
  height: number
}) {
  const colors = useChartColors()
  const compareMode = entries.length > 1

  if (compareMode) {
    const { data, roleKeys } = buildMultiRoleRadarData(entries)
    if (data.length === 0) return null

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke={colors.gridStroke} />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 9, fill: colors.tickFill }}
          />
          <Tooltip contentStyle={colors.tooltipStyle} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
          {roleKeys.map((roleId, index) => {
            const entry = entries.find((item) => item.id === roleId)
            return (
              <Radar
                key={roleId}
                dataKey={roleId}
                name={entry?.roleTitle ?? "Role"}
                stroke={colors.roleColors[index % colors.roleColors.length]}
                fill={colors.roleColors[index % colors.roleColors.length]}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            )
          })}
        </RadarChart>
      </ResponsiveContainer>
    )
  }

  const detail = parseJobFitAnalysisDetailed(entries[0]?.analysisMarkdown ?? "")
  if (!detail) return null

  const data = buildSkillRadarData(detail)
  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid stroke={colors.gridStroke} />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fontSize: 9, fill: colors.tickFill }}
        />
        <Radar
          dataKey="score"
          name="Match"
          stroke={colors.strong}
          fill={colors.strong}
          fillOpacity={0.22}
          strokeWidth={2}
        />
        <Tooltip contentStyle={colors.tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function JobFitSkillChart({
  entries,
  variant = "panel",
  layout = "full",
  className,
}: JobFitSkillChartProps) {
  const isCompact = variant === "compact"
  const barHeight = isCompact ? 120 : 150
  const radarHeight = isCompact ? 150 : 200
  const showRadar = layout === "full"

  if (entries.length === 0) return null

  const hasData = entries.some((entry) => {
    const detail = parseJobFitAnalysisDetailed(entry.analysisMarkdown)
    return detail && hasSkillChartData(detail)
  })

  if (!hasData) {
    return (
      <p className="text-[10px] text-muted-foreground/55">
        No skill breakdown available for charting.
      </p>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-lg border border-border/40 bg-background p-2.5">
        <p className="mb-1.5 text-[10px] font-medium text-muted-foreground/60">
          {entries.length > 1 ? "Match mix by role" : "Match summary"}
        </p>
        <SummaryBarChart entries={entries} height={barHeight} />
      </div>

      {showRadar ? (
        <div className="overflow-hidden rounded-lg border border-border/40 bg-background p-2.5">
          <p className="mb-1.5 text-[10px] font-medium text-muted-foreground/60">
            {entries.length > 1 ? "Skill overlap" : "Skill coverage"}
          </p>
          <SkillRadarChart entries={entries} height={radarHeight} />
        </div>
      ) : null}
    </div>
  )
}

type JobFitSkillChartFromMarkdownProps = {
  markdown: string
  variant?: ChartVariant
  layout?: ChartLayout
  className?: string
}

export function JobFitSkillChartFromMarkdown({
  markdown,
  variant = "compact",
  layout = "full",
  className,
}: JobFitSkillChartFromMarkdownProps) {
  const detail = parseJobFitAnalysisDetailed(markdown)
  if (!detail || !hasSkillChartData(detail)) return null

  const entry: JobFitHistoryEntry = {
    id: "inline",
    messageId: "inline",
    roleTitle: detail.roleTitle,
    fitScore: detail.fitScore,
    fitScoreLabel: detail.fitScoreLabel,
    analysisMarkdown: markdown,
    createdAt: new Date().toISOString(),
  }

  return (
    <JobFitSkillChart
      className={className}
      entries={[entry]}
      layout={layout}
      variant={variant}
    />
  )
}
