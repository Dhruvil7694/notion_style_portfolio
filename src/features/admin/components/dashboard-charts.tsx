"use client"

import type { CSSProperties } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const CONTENT_COLORS: Record<string, string> = {
  blog: "var(--chart-1)",
  research: "var(--chart-2)",
  automation: "var(--chart-3)",
  note: "var(--chart-4)",
  publication: "var(--chart-5)",
}

const STATUS_COLORS: Record<string, string> = {
  published: "var(--chart-1)",
  draft: "var(--chart-4)",
  archived: "color-mix(in oklch, var(--muted-foreground) 60%, transparent)",
}

const tooltipStyle: CSSProperties = {
  backgroundColor: "transparent",
  border: "none",
  padding: "0",
  boxShadow: "none",
  color: "var(--card-foreground)",
}

const tooltipWrapperStyle: CSSProperties = {
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  backgroundColor: "color-mix(in oklch, var(--card) 85%, transparent)",
  border: "1px solid color-mix(in oklch, var(--border) 60%, transparent)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "var(--card-foreground)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  padding: "8px 12px",
}

const tooltipItemStyle: CSSProperties = {
  color: "var(--card-foreground)",
}

const tooltipLabelStyle: CSSProperties = {
  color: "var(--card-foreground)",
  marginBottom: "4px",
  fontWeight: 500,
}

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 }
const gridStroke = "color-mix(in oklch, var(--border) 35%, transparent)"

type ContentTypeEntry = {
  type: string
  count: number
}

type ProjectStatusEntry = {
  status: string
  count: number
}

type SkillCategoryEntry = {
  category: string
  count: number
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
      {message}
    </div>
  )
}

export function ContentTypeDonut({ data }: { data: ContentTypeEntry[] }) {
  const filtered = data.filter((d) => d.count > 0)

  if (filtered.length === 0) {
    return <EmptyChart message="No content items yet." />
  }

  const pieData = filtered.map((d) => ({
    name: d.type.charAt(0).toUpperCase() + d.type.slice(1),
    value: d.count,
    fill: CONTENT_COLORS[d.type] ?? "var(--chart-5)",
  }))

  const total = filtered.reduce((s, d) => s + d.count, 0)

  return (
    <div className="relative">
      <ResponsiveContainer height={220} width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="50%"
            data={pieData}
            dataKey="value"
            innerRadius={62}
            label={({ name, percent }) =>
              percent > 0.08
                ? `${name} ${Math.round((percent ?? 0) * 100)}%`
                : ""
            }
            labelLine={false}
            nameKey="name"
            outerRadius={96}
            paddingAngle={3}
            strokeWidth={0}
          >
            {pieData.map((entry) => (
              <Cell fill={entry.fill} key={entry.name} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [value, name]}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
            wrapperStyle={tooltipWrapperStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold">{total}</p>
          <p className="text-muted-foreground text-xs">total</p>
        </div>
      </div>
    </div>
  )
}

export function ProjectStatusBars({ data }: { data: ProjectStatusEntry[] }) {
  const filtered = data.filter((d) => d.count > 0)

  if (filtered.length === 0) {
    return <EmptyChart message="No projects yet." />
  }

  const barData = filtered.map((d) => ({
    status: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    count: d.count,
    fill: STATUS_COLORS[d.status] ?? "var(--chart-5)",
  }))

  return (
    <ResponsiveContainer height={200} width="100%">
      <BarChart
        data={barData}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke={gridStroke}
          strokeDasharray="3 3"
        />
        <XAxis
          axisLine={false}
          tick={axisTick}
          tickLine={false}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="status"
          tick={axisTick}
          tickLine={false}
          type="category"
          width={68}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{
            fill: "color-mix(in oklch, var(--muted) 40%, transparent)",
          }}
          formatter={(value, name) => [value, "Projects"]}
          itemStyle={tooltipItemStyle}
          labelStyle={tooltipLabelStyle}
          wrapperStyle={tooltipWrapperStyle}
        />
        <Bar dataKey="count" name="Projects" radius={[0, 6, 6, 0]}>
          {barData.map((entry) => (
            <Cell fill={entry.fill} key={entry.status} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SkillCategoryBars({ data }: { data: SkillCategoryEntry[] }) {
  const top = data.slice(0, 6)

  if (top.length === 0) {
    return <EmptyChart message="No skills yet." />
  }

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "color-mix(in oklch, var(--chart-1) 70%, var(--chart-3))",
  ]

  const barData = top.map((d, i) => ({
    category:
      d.category.length > 14 ? `${d.category.slice(0, 13)}…` : d.category,
    count: d.count,
    fill: colors[i % colors.length],
  }))

  return (
    <ResponsiveContainer height={200} width="100%">
      <BarChart
        data={barData}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke={gridStroke}
          strokeDasharray="3 3"
        />
        <XAxis
          axisLine={false}
          tick={axisTick}
          tickLine={false}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="category"
          tick={axisTick}
          tickLine={false}
          type="category"
          width={90}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{
            fill: "color-mix(in oklch, var(--muted) 40%, transparent)",
          }}
          formatter={(value) => [value, "Skills"]}
          itemStyle={tooltipItemStyle}
          labelStyle={tooltipLabelStyle}
          wrapperStyle={tooltipWrapperStyle}
        />
        <Bar dataKey="count" name="Skills" radius={[0, 6, 6, 0]}>
          {barData.map((entry) => (
            <Cell fill={entry.fill} key={entry.category} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
