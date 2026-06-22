export const JOINT_FLOW_LAYOUT = {
  nodeWidth: 240,
  nodeHeight: 56,
  gapY: 48,
  padding: 24,
} as const

export type FlowGraphElement = {
  id: string
  label: string
  step: string
  x: number
  y: number
  width: number
  height: number
}

export type FlowGraphLink = {
  id: string
  source: { id: string; anchor: { name: string } }
  target: { id: string; anchor: { name: string } }
  router: { name: string }
  connector: { name: string }
}

export function buildLinearFlowGraph(labels: string[]) {
  const { nodeWidth, nodeHeight, gapY, padding } = JOINT_FLOW_LAYOUT

  const elements: FlowGraphElement[] = labels.map((label, index) => ({
    id: `flow-node-${index}`,
    label,
    step: String(index + 1).padStart(2, "0"),
    x: padding,
    y: padding + index * (nodeHeight + gapY),
    width: nodeWidth,
    height: nodeHeight,
  }))

  const links: FlowGraphLink[] = labels.slice(0, -1).map((_, index) => ({
    id: `flow-link-${index}`,
    source: { id: `flow-node-${index}`, anchor: { name: "bottom" } },
    target: { id: `flow-node-${index + 1}`, anchor: { name: "top" } },
    router: { name: "normal" },
    connector: { name: "rounded" },
  }))

  const height =
    labels.length > 0
      ? padding * 2 + labels.length * nodeHeight + Math.max(0, labels.length - 1) * gapY
      : 0

  return { elements, links, height, width: nodeWidth + padding * 2 }
}
