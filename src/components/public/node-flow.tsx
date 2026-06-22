type NodeFlowProps = {
  nodes: string[]
}

export function NodeFlow({ nodes }: NodeFlowProps) {
  if (nodes.length === 0) {
    return null
  }

  return (
    <div className="case-study-flow">
      {nodes.map((label, index) => (
        <div className="case-study-flow-item" key={`${label}-${index}`}>
          <div className="case-study-flow-node">{label}</div>
          {index < nodes.length - 1 ? (
            <div aria-hidden className="case-study-flow-arrow">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
