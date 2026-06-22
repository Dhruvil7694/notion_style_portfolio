"use client"

import { Handle, type NodeProps,Position } from "@xyflow/react"
import { memo } from "react"

import type { ArchitectureNodeType } from "@/lib/diagrams/architecture-graph.schema"
import { resolveLucideIcon } from "@/lib/diagrams/lucide-icons"

export type ArchitectureNodeData = {
  label: string
  description?: string
  icon?: string
  nodeType: ArchitectureNodeType
  compact?: boolean
}

function ArchitectureNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as ArchitectureNodeData
  const Icon = resolveLucideIcon(nodeData.icon, nodeData.nodeType)
  const compact = nodeData.compact ?? false

  return (
    <div
      className={`architecture-graph-node${compact ? " architecture-graph-node-compact" : ""}${selected ? " architecture-graph-node-selected" : ""}`}
    >
      <Handle className="architecture-graph-handle" id="t-top" position={Position.Top} type="target" />
      <Handle className="architecture-graph-handle" id="s-top" position={Position.Top} type="source" />
      <Handle
        className="architecture-graph-handle"
        id="t-bottom"
        position={Position.Bottom}
        type="target"
      />
      <Handle
        className="architecture-graph-handle"
        id="s-bottom"
        position={Position.Bottom}
        type="source"
      />
      <Handle className="architecture-graph-handle" id="t-left" position={Position.Left} type="target" />
      <Handle className="architecture-graph-handle" id="s-left" position={Position.Left} type="source" />
      <Handle
        className="architecture-graph-handle"
        id="t-right"
        position={Position.Right}
        type="target"
      />
      <Handle
        className="architecture-graph-handle"
        id="s-right"
        position={Position.Right}
        type="source"
      />

      <div className="architecture-graph-node-header">
        <Icon aria-hidden className="architecture-graph-node-icon" />
        <span className="architecture-graph-node-type">
          {nodeData.nodeType.charAt(0).toUpperCase() + nodeData.nodeType.slice(1)}
        </span>
      </div>
      <p className="architecture-graph-node-label">{nodeData.label}</p>
      {!compact && nodeData.description?.trim() ? (
        <p className="architecture-graph-node-description">{nodeData.description}</p>
      ) : null}
    </div>
  )
}

export const ArchitectureNode = memo(ArchitectureNodeComponent)

export const architectureNodeTypes = {
  architecture: ArchitectureNode,
}
