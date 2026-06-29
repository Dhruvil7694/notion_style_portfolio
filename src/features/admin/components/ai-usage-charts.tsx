"use client"

import React, { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatAdminShortDate } from "@/features/admin/lib/admin-datetime"
import type {
  AiUsageSummary,
  AiUsageTimeSeriesEntry,
} from "@/features/admin/lib/ai-usage-queries"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "color-mix(in oklch, var(--chart-1) 70%, var(--chart-3))",
  "color-mix(in oklch, var(--chart-2) 70%, var(--chart-4))",
]

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "none",
  borderRadius: "0",
  padding: "0",
  boxShadow: "none",
}

const tooltipWrapperStyle: React.CSSProperties = {
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  backgroundColor: "color-mix(in oklch, var(--card) 80%, transparent)",
  border: "1px solid color-mix(in oklch, var(--border) 60%, transparent)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "var(--card-foreground)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  padding: "8px 12px",
}

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 }
const gridStroke = "color-mix(in oklch, var(--border) 35%, transparent)"

type AiUsageChartsProps = {
  timeSeries: AiUsageTimeSeriesEntry[]
  byProvider: AiUsageSummary["byProvider"]
  byRole: AiUsageSummary["byRole"]
}

function formatShortDate(date: string): string {
  return formatAdminShortDate(`${date}T12:00:00`)
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card/40 border-border/60 space-y-3 rounded-xl border p-4 shadow-sm backdrop-blur-sm">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
      {message}
    </div>
  )
}

export function AiUsageCharts({
  timeSeries,
  byProvider,
  byRole,
}: AiUsageChartsProps) {
  const lineData = useMemo(
    () =>
      timeSeries.map((row) => ({
        date: formatShortDate(row.date),
        requests: row.requests,
        cost: Number(row.cost.toFixed(6)),
        tokens: row.tokens,
      })),
    [timeSeries]
  )

  const barData = useMemo(
    () =>
      byProvider.map((row) => ({
        provider: row.provider,
        cost: Number(row.cost.toFixed(6)),
        requests: row.count,
        avgLatency: row.avgLatency,
      })),
    [byProvider]
  )

  const pieData = useMemo(
    () =>
      byRole.map((row) => ({
        name: row.role,
        value: row.count,
      })),
    [byRole]
  )

  const tokenData = useMemo(
    () =>
      timeSeries.map((row) => ({
        date: formatShortDate(row.date),
        tokens: row.tokens,
      })),
    [timeSeries]
  )

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Daily activity — area chart */}
      <ChartCard
        description="Requests and tracked cost over the last 7 days"
        title="Daily activity"
      >
        {lineData.length === 0 ? (
          <EmptyChart message="No daily activity yet." />
        ) : (
          <ResponsiveContainer height={240} width="100%">
            <AreaChart
              data={lineData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradRequests" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="gradCost" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={gridStroke}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="date"
                tick={axisTick}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={axisTick}
                tickLine={false}
                width={32}
                yAxisId="requests"
              />
              <YAxis
                axisLine={false}
                orientation="right"
                tick={axisTick}
                tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                tickLine={false}
                width={54}
                yAxisId="cost"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                wrapperStyle={tooltipWrapperStyle}
                formatter={(value, name) => {
                  if (name === "Requests") return [value, "Requests"]
                  return [`$${Number(value).toFixed(6)}`, "Cost"]
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Area
                dataKey="requests"
                dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
                fill="url(#gradRequests)"
                name="Requests"
                stroke="var(--chart-1)"
                strokeWidth={2}
                type="monotone"
                yAxisId="requests"
              />
              <Area
                dataKey="cost"
                dot={{ r: 3, fill: "var(--chart-2)", strokeWidth: 0 }}
                fill="url(#gradCost)"
                name="Cost"
                stroke="var(--chart-2)"
                strokeWidth={2}
                type="monotone"
                yAxisId="cost"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Cost by provider — bar chart */}
      <ChartCard
        description="Tracked spend per provider (7 days)"
        title="Cost by provider"
      >
        {barData.length === 0 ? (
          <EmptyChart message="No provider costs logged yet." />
        ) : (
          <ResponsiveContainer height={240} width="100%">
            <BarChart
              barSize={barData.length === 1 ? 48 : undefined}
              data={barData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke={gridStroke}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="provider"
                tick={axisTick}
                tickFormatter={(v: string) =>
                  v.length > 10 ? `${v.slice(0, 10)}…` : v
                }
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={axisTick}
                tickFormatter={(v: number) => `$${v.toFixed(4)}`}
                tickLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                wrapperStyle={tooltipWrapperStyle}
                cursor={{
                  fill: "color-mix(in oklch, var(--muted) 40%, transparent)",
                }}
                formatter={(value, name) => {
                  if (name === "Tracked cost")
                    return [`$${Number(value).toFixed(6)}`, "Tracked cost"]
                  return [value, name]
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Bar dataKey="cost" name="Tracked cost" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    fill={COLORS[index % COLORS.length]}
                    key={entry.provider}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Requests by role — donut */}
      <ChartCard
        description="Share of AI calls by assistant role (7 days)"
        title="Requests by role"
      >
        {pieData.length === 0 ? (
          <EmptyChart message="No role breakdown yet." />
        ) : (
          <ResponsiveContainer height={260} width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="46%"
                data={pieData}
                dataKey="value"
                innerRadius={64}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
                nameKey="name"
                outerRadius={104}
                paddingAngle={3}
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell fill={COLORS[index % COLORS.length]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                wrapperStyle={tooltipWrapperStyle}
                formatter={(value, name) => [value, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Token volume — area chart */}
      <ChartCard
        description="Total tokens processed per day (7 days)"
        title="Token volume"
      >
        {tokenData.length === 0 ? (
          <EmptyChart message="No token data yet." />
        ) : (
          <ResponsiveContainer height={260} width="100%">
            <AreaChart
              data={tokenData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradTokens" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={gridStroke}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="date"
                tick={axisTick}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={axisTick}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                wrapperStyle={tooltipWrapperStyle}
                formatter={(value) => [
                  Number(value).toLocaleString("en-US"),
                  "Tokens",
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Area
                dataKey="tokens"
                dot={{ r: 3, fill: "var(--chart-3)", strokeWidth: 0 }}
                fill="url(#gradTokens)"
                name="Tokens"
                stroke="var(--chart-3)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
