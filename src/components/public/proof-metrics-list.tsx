"use client"

import { BarChart3, Briefcase, FlaskConical, type LucideIcon,Rocket } from "lucide-react"
import { useId, useRef, useState } from "react"

import {
  HoverPreviewCard,
  useHoverPreviewDelays,
} from "@/components/public/hover-preview-card"
import {
  metricHasPreview,
  type MetricPreviewContext,
  resolveMetricPreview,
} from "@/lib/public/metric-previews"
import { cn } from "@/lib/utils"

type ProofMetricsListProps = {
  metrics: string[]
  context: MetricPreviewContext
}

const METRIC_ICONS = {
  production: Rocket,
  ai_projects: Briefcase,
  research: FlaskConical,
  experience: BarChart3,
} as const satisfies Record<string, LucideIcon>

function resolveMetricIcon(metric: string): LucideIcon {
  const normalized = metric.toLowerCase()

  if (normalized.includes("production")) {
    return METRIC_ICONS.production
  }

  if (normalized.includes("research")) {
    return METRIC_ICONS.research
  }

  if (normalized.includes("project") || normalized.includes("ai")) {
    return METRIC_ICONS.ai_projects
  }

  return METRIC_ICONS.experience
}

function ProofMetricItem({
  metric,
  context,
}: {
  metric: string
  context: MetricPreviewContext
}) {
  const [open, setOpen] = useState(false)
  const itemRef = useRef<HTMLLIElement>(null)
  const previewId = useId()
  const { scheduleOpen, scheduleClose, clearTimers } = useHoverPreviewDelays()
  const preview = resolveMetricPreview(metric, context)
  const interactive = metricHasPreview(metric) && preview !== null

  const show = () => {
    if (!interactive) {
      return
    }
    scheduleOpen(() => setOpen(true))
  }

  const hide = () => {
    scheduleClose(() => setOpen(false))
  }

  const keepOpen = () => {
    clearTimers()
    setOpen(true)
  }

  return (
    <>
      <li
        ref={itemRef}
        aria-describedby={open ? previewId : undefined}
        className={cn("proof-metric", interactive && "proof-metric-interactive", open && "is-preview-open")}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hide()
          }
        }}
        onFocus={interactive ? show : undefined}
        onMouseEnter={interactive ? show : undefined}
        onMouseLeave={interactive ? hide : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {metric}
      </li>

      {preview ? (
        <HoverPreviewCard
          anchorRef={itemRef}
          items={preview.items}
          onMouseEnter={keepOpen}
          onMouseLeave={hide}
          open={open}
          previewId={previewId}
          title={preview.title}
          titleIcon={resolveMetricIcon(metric)}
          viewAllHref={preview.viewAllHref}
          viewAllLabel={preview.viewAllLabel}
        />
      ) : null}
    </>
  )
}

export function ProofMetricsList({ metrics, context }: ProofMetricsListProps) {
  return (
    <ul className="proof-metrics">
      {metrics.map((metric) => (
        <ProofMetricItem context={context} key={metric} metric={metric} />
      ))}
    </ul>
  )
}
