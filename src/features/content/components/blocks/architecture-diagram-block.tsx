"use client"

import type {
  ArchitectureEdge,
  ArchitectureNode,
} from "@/features/content/lib/schema"
import { cn } from "@/shared/lib/utils"

type ArchitectureDiagramBlockProps = {
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
  className?: string
}

const NODE_WIDTH = 96
const NODE_HEIGHT = 36
const PADDING = 24

function layoutNodes(
  nodes: ArchitectureNode[]
): Array<ArchitectureNode & { x: number; y: number }> {
  return nodes.map((node, index) => ({
    ...node,
    x: node.x ?? PADDING + index * (NODE_WIDTH + 32),
    y: node.y ?? 48,
  }))
}

export function ArchitectureDiagramBlock({
  nodes,
  edges,
  className,
}: ArchitectureDiagramBlockProps) {
  const positioned = layoutNodes(nodes)
  const nodeMap = new Map(positioned.map((node) => [node.id, node]))
  const width =
    Math.max(...positioned.map((node) => node.x + NODE_WIDTH), 320) + PADDING
  const height =
    Math.max(...positioned.map((node) => node.y + NODE_HEIGHT), 120) + PADDING

  return (
    <figure
      aria-label="Architecture diagram"
      className={cn(
        "bg-muted/20 border-border overflow-x-auto rounded-lg border p-4",
        className
      )}
    >
      <svg
        className="min-w-full"
        height={height}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        {edges.map((edge) => {
          const from = nodeMap.get(edge.from)
          const to = nodeMap.get(edge.to)
          if (!from || !to) {
            return null
          }

          const x1 = from.x + NODE_WIDTH
          const y1 = from.y + NODE_HEIGHT / 2
          const x2 = to.x
          const y2 = to.y + NODE_HEIGHT / 2
          const midX = (x1 + x2) / 2

          return (
            <g key={`${edge.from}-${edge.to}`}>
              <path
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.35}
              />
              {edge.label ? (
                <text
                  className="fill-muted-foreground text-[10px]"
                  textAnchor="middle"
                  x={midX}
                  y={(y1 + y2) / 2 - 6}
                >
                  {edge.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {positioned.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              className="fill-background stroke-border"
              height={NODE_HEIGHT}
              rx={8}
              strokeWidth={1}
              width={NODE_WIDTH}
            />
            <text
              className="fill-foreground text-[11px] font-medium"
              dominantBaseline="middle"
              textAnchor="middle"
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2}
            >
              {node.label.length > 12
                ? `${node.label.slice(0, 11)}…`
                : node.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  )
}
