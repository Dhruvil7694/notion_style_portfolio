import type { ProjectFacts } from "@/features/knowledge-base/lib/schemas"

type ProjectFactsGridProps = {
  facts: ProjectFacts
}

export function ProjectFactsGrid({ facts }: ProjectFactsGridProps) {
  const entries = Object.entries(facts).filter(([, value]) => value.trim())

  if (entries.length === 0) {
    return null
  }

  return (
    <dl className="project-facts-grid">
      {entries.map(([label, value]) => (
        <div className="project-facts-item" key={label}>
          <dt className="project-facts-label">{formatFactLabel(label)}</dt>
          <dd className="project-facts-value">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function formatFactLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}
