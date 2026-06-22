import type { ProjectMetric } from "@/lib/public/project-case-study"

type MetricsGridProps = {
  items: ProjectMetric[]
}

export function MetricsGrid({ items }: MetricsGridProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <dl className="case-study-metrics">
      {items.map((item, index) => (
        <div className="case-study-metric" key={`${item.label}-${index}`}>
          <dt className="case-study-metric-value">{item.value}</dt>
          <dd className="case-study-metric-label">{item.label}</dd>
        </div>
      ))}
    </dl>
  )
}
