"use client"

import { useId, useRef, useState } from "react"

import {
  metricHasPreview,
  type MetricPreviewContext,
  resolveMetricPreview,
} from "@/features/portfolio/lib/metric-previews"
import { HoverBulletList } from "@/features/site-shell/components/hover-bullet-list"
import { useHoverPreviewDelays } from "@/features/site-shell/components/hover-preview-card"
import { cn } from "@/shared/lib/utils"

type ProofMetricsListProps = {
  metrics: string[]
  context: MetricPreviewContext
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
        className={cn(
          "proof-metric",
          interactive && "proof-metric-interactive",
          open && "is-preview-open"
        )}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
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
        <HoverBulletList
          anchorRef={itemRef}
          emptyMessage="No matching items yet."
          items={preview.items}
          label={preview.title}
          onMouseEnter={keepOpen}
          onMouseLeave={hide}
          open={open}
          previewId={previewId}
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
