"use client"

import "@xyflow/react/dist/style.css"

import {
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react"
import { useEffect, useMemo } from "react"

import { architectureNodeTypes } from "@/components/diagrams/architecture-node"
import { DiagramToolbar } from "@/components/diagrams/diagram-toolbar"
import { architectureEdgeTypes } from "@/components/diagrams/labeled-edge"
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport"
import type {
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
} from "@/lib/diagrams/architecture-graph.schema"
import {
  toReactFlowEdges,
  toReactFlowNodes,
} from "@/lib/diagrams/react-flow-adapters"
import { cn } from "@/lib/utils"

type ArchitectureDiagramProps = {
  nodes: ArchitectureGraphNode[]
  edges: ArchitectureGraphEdge[]
  className?: string
}

function FitViewOnLoad({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (nodeCount === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      fitView({ padding: 0.45, duration: 0, minZoom: 0.55, maxZoom: 1.1 })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fitView, nodeCount])

  return null
}

function ArchitectureDiagramCanvas({
  nodes,
  edges,
  className,
}: ArchitectureDiagramProps) {
  const isMobile = useIsMobileViewport()
  const initialNodes = useMemo(
    () => toReactFlowNodes(nodes, { draggable: false, selectable: false, compact: true }),
    [nodes]
  )
  const initialEdges = useMemo(() => toReactFlowEdges(edges, nodes, { labelMode: "spaced" }), [edges, nodes])
  const [flowNodes, setFlowNodes] = useNodesState(initialNodes)
  const [flowEdges, setFlowEdges] = useEdgesState(initialEdges)

  useEffect(() => {
    setFlowNodes(initialNodes)
    setFlowEdges(initialEdges)
  }, [initialEdges, initialNodes, setFlowEdges, setFlowNodes])

  return (
    <div
      className={cn(
        "architecture-graph-viewport",
        isMobile && "architecture-graph-viewport-mobile",
        className
      )}
    >
      <ReactFlow
        edges={flowEdges}
        edgeTypes={architectureEdgeTypes}
        fitView
        maxZoom={1.1}
        minZoom={0.45}
        nodes={flowNodes}
        nodeTypes={architectureNodeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        panOnDrag={!isMobile}
        panOnScroll={!isMobile}
        proOptions={{ hideAttribution: true }}
        zoomOnPinch={!isMobile}
        zoomOnScroll={!isMobile}
      >
        {!isMobile ? <DiagramToolbar /> : null}
        <FitViewOnLoad nodeCount={nodes.length} />
      </ReactFlow>
    </div>
  )
}

export function ArchitectureDiagram(props: ArchitectureDiagramProps) {
  if (props.nodes.length === 0) {
    return null
  }

  return (
    <ReactFlowProvider>
      <ArchitectureDiagramCanvas {...props} />
    </ReactFlowProvider>
  )
}
