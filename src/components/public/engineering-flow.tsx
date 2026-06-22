type EngineeringFlowProps = {
  nodes: string[]
  variant?: "default" | "ai" | "architecture"
}

export function EngineeringFlow({ nodes, variant = "default" }: EngineeringFlowProps) {
  if (nodes.length === 0) {
    return null
  }

  return (
    <div className={`engineering-flow engineering-flow-${variant}`}>
      {nodes.map((label, index) => (
        <div className="engineering-flow-step" key={`${label}-${index}`}>
          <div className="engineering-flow-rail" aria-hidden>
            <span className="engineering-flow-dot" />
            {index < nodes.length - 1 ? <span className="engineering-flow-line" /> : null}
          </div>
          <div className="engineering-flow-node">
            <span className="engineering-flow-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="engineering-flow-label">{label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
