type AiSummaryBlockProps = {
  summary: string
}

export function AiSummaryBlock({ summary }: AiSummaryBlockProps) {
  const text = summary.trim()

  if (!text) {
    return null
  }

  return (
    <aside aria-label="AI summary" className="knowledge-ai-summary">
      <p className="knowledge-ai-summary-label">Summary</p>
      <p className="knowledge-ai-summary-text">{text}</p>
    </aside>
  )
}
