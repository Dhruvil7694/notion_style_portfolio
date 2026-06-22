"use client"

import { createElements, createLinks, GraphProvider, Paper, type RenderElement } from "@joint/react"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildLinearFlowGraph,
  type FlowGraphElement,
  JOINT_FLOW_LAYOUT,
} from "@/lib/diagrams/build-linear-flow-graph"
import { cn } from "@/lib/utils"

type JointFlowDiagramProps = {
  nodes: string[]
  variant?: "default" | "ai" | "architecture"
  className?: string
}

function readThemeColor(variable: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value || fallback
}

export function JointFlowDiagram({
  nodes,
  variant = "default",
  className,
}: JointFlowDiagramProps) {
  const [mounted, setMounted] = useState(false)
  const labels = useMemo(() => nodes.map((node) => node.trim()).filter(Boolean), [nodes])

  const graph = useMemo(() => {
    const raw = buildLinearFlowGraph(labels)
    return {
      elements: createElements(raw.elements),
      links: createLinks(raw.links),
      height: raw.height,
    }
  }, [labels])

  useEffect(() => {
    setMounted(true)
  }, [])

  const renderElement = useCallback<RenderElement<FlowGraphElement>>(
    (element) => (
      <div className={cn("joint-flow-node", `joint-flow-node-${variant}`)}>
        <span className="joint-flow-node-step">{element.step}</span>
        <span className="joint-flow-node-label">{element.label}</span>
      </div>
    ),
    [variant]
  )

  if (labels.length === 0) {
    return null
  }

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn("joint-flow-diagram joint-flow-diagram-loading", className)}
        style={{ height: graph.height, minHeight: JOINT_FLOW_LAYOUT.nodeHeight }}
      />
    )
  }

  const linkColor = readThemeColor("--muted-foreground", "#71717a")

  const themedLinks = graph.links.map((link) => ({
    ...link,
    attrs: {
      line: {
        stroke: linkColor,
        strokeWidth: 1.5,
        targetMarker: {
          type: "path",
          d: "M 8 -4 0 0 8 4",
          fill: "none",
        },
      },
    },
  }))

  return (
    <div
      className={cn("joint-flow-diagram", className)}
      style={{ height: graph.height, width: "100%" }}
    >
      <GraphProvider initialElements={graph.elements} initialLinks={themedLinks}>
        <Paper
          async
          background={{ color: "transparent" }}
          className="joint-flow-paper"
          clickThreshold={10}
          gridSize={1}
          height={graph.height}
          interactive={false}
          renderElement={renderElement}
          useHTMLOverlay
          width="100%"
        />
      </GraphProvider>
    </div>
  )
}
