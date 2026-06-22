"use client"

import dynamic from "next/dynamic"

import type {
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
} from "@/lib/diagrams/architecture-graph.schema"
import { cn } from "@/lib/utils"

type ArchitectureDiagramProps = {
  nodes: ArchitectureGraphNode[]
  edges: ArchitectureGraphEdge[]
  className?: string
}

function ArchitectureDiagramFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("architecture-graph-viewport architecture-graph-loading", className)}
    />
  )
}

const ArchitectureDiagramImpl = dynamic(
  () =>
    import("@/components/diagrams/architecture-diagram").then((mod) => ({
      default: mod.ArchitectureDiagram,
    })),
  {
    ssr: false,
    loading: () => <ArchitectureDiagramFallback />,
  }
)

export function ArchitectureDiagramLazy(props: ArchitectureDiagramProps) {
  if (props.nodes.length === 0) {
    return null
  }

  return <ArchitectureDiagramImpl {...props} />
}
