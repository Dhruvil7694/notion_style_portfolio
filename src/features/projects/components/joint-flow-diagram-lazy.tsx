"use client"

import dynamic from "next/dynamic"

import { JOINT_FLOW_LAYOUT } from "@/features/diagrams/lib/build-linear-flow-graph"
import { cn } from "@/shared/lib/utils"

type JointFlowDiagramProps = {
  nodes: string[]
  variant?: "default" | "ai" | "architecture"
  className?: string
}

function JointFlowDiagramFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("joint-flow-diagram joint-flow-diagram-loading", className)}
      style={{ minHeight: JOINT_FLOW_LAYOUT.nodeHeight }}
    />
  )
}

const JointFlowDiagramImpl = dynamic(
  () =>
    import("@/features/projects/components/joint-flow-diagram").then((mod) => ({
      default: mod.JointFlowDiagram,
    })),
  {
    ssr: false,
    loading: () => <JointFlowDiagramFallback />,
  }
)

export function JointFlowDiagram(props: JointFlowDiagramProps) {
  if (props.nodes.length === 0) {
    return null
  }

  return <JointFlowDiagramImpl {...props} />
}
