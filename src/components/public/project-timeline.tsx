import type { ProjectTimelineEntry } from "@/lib/public/project-case-study"

type ProjectTimelineProps = {
  items: ProjectTimelineEntry[]
}

export function ProjectTimeline({ items }: ProjectTimelineProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <ol className="case-study-timeline">
      {items.map((entry, index) => (
        <li className="case-study-timeline-entry" key={`${entry.period}-${index}`}>
          <div className="case-study-timeline-marker" aria-hidden>
            <span className="case-study-timeline-dot" />
            {index < items.length - 1 ? <span className="case-study-timeline-line" /> : null}
          </div>
          <div className="case-study-timeline-content">
            <p className="case-study-timeline-period">{entry.period}</p>
            <p className="case-study-timeline-title">{entry.title}</p>
            {entry.description?.trim() ? (
              <p className="case-study-timeline-description">{entry.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
