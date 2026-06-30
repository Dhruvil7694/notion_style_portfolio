import type { ProjectFacts } from "@/features/knowledge-base/lib/schemas"
import type { ProjectMetric } from "@/features/portfolio/lib/project-case-study"
import { cn } from "@/shared/lib/utils"

type HighlightItem = {
  id: string
  kind: "fact" | "metric"
  label: string
  value: string
}

type ProjectHighlightsGridProps = {
  facts: ProjectFacts
  metrics: ProjectMetric[]
}

export function ProjectHighlightsGrid({
  facts,
  metrics,
}: ProjectHighlightsGridProps) {
  const items = buildHighlightItems(facts, metrics)

  if (items.length === 0) {
    return null
  }

  return (
    <dl className="project-highlights-masonry">
      {items.map((item) => (
        <div
          className={cn(
            "project-highlight-card",
            item.kind === "metric" && "project-highlight-card--metric"
          )}
          key={item.id}
        >
          {item.kind === "metric" ? (
            <>
              <dt className="project-highlight-metric-value">{item.value}</dt>
              <dd className="project-highlight-caption">{item.label}</dd>
            </>
          ) : (
            <>
              <dt className="project-highlight-fact-label">{item.label}</dt>
              <dd className="project-highlight-fact-value">{item.value}</dd>
            </>
          )}
        </div>
      ))}
    </dl>
  )
}

function buildHighlightItems(
  facts: ProjectFacts,
  metrics: ProjectMetric[]
): HighlightItem[] {
  const factItems = Object.entries(facts)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => ({
      id: `fact-${key}`,
      kind: "fact" as const,
      label: formatFactLabel(key),
      value,
    }))

  const metricItems = metrics.map((item, index) => ({
    id: `metric-${index}-${item.label}`,
    kind: "metric" as const,
    label: item.label,
    value: item.value,
  }))

  return [...factItems, ...metricItems]
}

function formatFactLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}
