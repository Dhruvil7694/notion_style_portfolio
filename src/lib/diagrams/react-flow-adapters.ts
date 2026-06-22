import type { Edge, Node } from "@xyflow/react"

import type {
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
} from "@/lib/diagrams/architecture-graph.schema"

const MIN_LABELED_EDGE_DISTANCE = 110

function pickHandles(
  source: ArchitectureGraphNode,
  target: ArchitectureGraphNode
): { sourceHandle: string; targetHandle: string } {
  const dx = target.position.x - source.position.x
  const dy = target.position.y - source.position.y

  if (Math.abs(dx) > Math.abs(dy) * 0.55) {
    if (dx > 0) {
      return { sourceHandle: "s-right", targetHandle: "t-left" }
    }
    return { sourceHandle: "s-left", targetHandle: "t-right" }
  }

  if (dy >= 0) {
    return { sourceHandle: "s-bottom", targetHandle: "t-top" }
  }

  return { sourceHandle: "s-top", targetHandle: "t-bottom" }
}

function edgeDistance(
  source: ArchitectureGraphNode,
  target: ArchitectureGraphNode
): number {
  return Math.hypot(target.position.x - source.position.x, target.position.y - source.position.y)
}

export function toReactFlowNodes(
  nodes: ArchitectureGraphNode[],
  options?: { selectable?: boolean; draggable?: boolean; compact?: boolean }
): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "architecture",
    position: node.position,
    selectable: options?.selectable ?? false,
    draggable: options?.draggable ?? false,
    data: {
      label: node.label,
      description: node.description ?? "",
      icon: node.icon ?? "",
      nodeType: node.type,
      compact: options?.compact ?? false,
    },
  }))
}

export function toReactFlowEdges(
  edges: ArchitectureGraphEdge[],
  nodes: ArchitectureGraphNode[],
  options?: { labelMode?: "all" | "spaced" }
): Edge[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const labelMode = options?.labelMode ?? "spaced"

  return edges.map((edge) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    const handles =
      source && target ? pickHandles(source, target) : { sourceHandle: "s-bottom", targetHandle: "t-top" }

    const label = edge.label?.trim() || undefined
    const showLabel =
      label &&
      (labelMode === "all" ||
        (source && target && edgeDistance(source, target) >= MIN_LABELED_EDGE_DISTANCE))

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: "labeled",
      label: showLabel ? label : undefined,
      animated: edge.animated ?? false,
      data: {
        animated: edge.animated ?? false,
      },
    }
  })
}

export function syncNodesFromReactFlow(
  nodes: ArchitectureGraphNode[],
  reactFlowNodes: Node[]
): ArchitectureGraphNode[] {
  const positionById = new Map(
    reactFlowNodes.map((node) => [node.id, node.position] as const)
  )

  return nodes.map((node) => {
    const position = positionById.get(node.id)
    return position ? { ...node, position } : node
  })
}

export function graphFromReactFlowState(
  storedNodes: ArchitectureGraphNode[],
  reactFlowNodes: Node[],
  reactFlowEdges: Edge[]
): { nodes: ArchitectureGraphNode[]; edges: ArchitectureGraphEdge[] } {
  const syncedNodes = syncNodesFromReactFlow(storedNodes, reactFlowNodes)

  const edges: ArchitectureGraphEdge[] = reactFlowEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === "string" ? edge.label : "",
    animated: Boolean(edge.animated),
  }))

  return { nodes: syncedNodes, edges }
}
