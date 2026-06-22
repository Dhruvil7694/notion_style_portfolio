"use client"

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react"
import { memo } from "react"

function LabeledEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  animated,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
    offset: 28,
  })

  const labelText = typeof label === "string" ? label.trim() : ""
  const placedX = sourceX + (targetX - sourceX) * 0.58
  const placedY = sourceY + (targetY - sourceY) * 0.58 - 8

  return (
    <>
      <BaseEdge
        className={`architecture-graph-edge${animated ? " architecture-graph-edge-animated" : ""}`}
        id={id}
        path={edgePath}
      />
      {labelText ? (
        <EdgeLabelRenderer>
          <div
            className="architecture-graph-edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${placedX}px, ${placedY}px)`,
            }}
          >
            {labelText}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

export const LabeledEdge = memo(LabeledEdgeComponent)

export const architectureEdgeTypes = {
  labeled: LabeledEdge,
}
