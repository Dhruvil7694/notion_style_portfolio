import type { ReactNode } from "react"

type ResultsListProps = {
  items: string[]
}

const METRIC_PATTERN =
  /\d+(?:[.,]\d+)?(?:x|%)?|\b\d+\s*(?:seconds?|minutes?|hours?|days?|weeks?|months?)\b/gi

function highlightMetrics(text: string): ReactNode[] {
  const parts = text.split(METRIC_PATTERN)
  const matches = text.match(METRIC_PATTERN) ?? []

  if (matches.length === 0) {
    return [text]
  }

  const nodes: ReactNode[] = []

  parts.forEach((part, index) => {
    if (part) {
      nodes.push(part)
    }

    const metric = matches[index]
    if (metric) {
      nodes.push(
        <span className="case-study-result-metric" key={`${metric}-${index}`}>
          {metric}
        </span>
      )
    }
  })

  return nodes
}

export function ResultsList({ items }: ResultsListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className="case-study-results">
      {items.map((item, index) => (
        <li className="case-study-result" key={`${item.slice(0, 24)}-${index}`}>
          <p className="case-study-result-text">{highlightMetrics(item)}</p>
        </li>
      ))}
    </ul>
  )
}
