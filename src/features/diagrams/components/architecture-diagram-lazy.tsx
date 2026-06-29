"use client"

import dynamic from "next/dynamic"

import type {
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
} from "@/features/diagrams/lib/architecture-graph.schema"
import { cn } from "@/shared/lib/utils"

type ArchitectureDiagramProps = {
  nodes: ArchitectureGraphNode[]
  edges: ArchitectureGraphEdge[]
  className?: string
}

function ArchitectureDiagramFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "architecture-graph-viewport architecture-graph-loading",
        className
      )}
    />
  )
}

const ArchitectureDiagramImpl = dynamic(
  () =>
    import("@/features/diagrams/components/architecture-diagram").then(
      (mod) => ({
        default: mod.ArchitectureDiagram,
      })
    ),
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
