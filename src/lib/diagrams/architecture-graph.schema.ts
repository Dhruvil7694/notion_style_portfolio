import { z } from "zod"

export const architectureNodeTypeSchema = z.enum([
  "user",
  "agent",
  "llm",
  "database",
  "service",
  "tool",
  "queue",
])

export type ArchitectureNodeType = z.infer<typeof architectureNodeTypeSchema>

export const architectureGraphNodeSchema = z.object({
  id: z.string().trim().min(1, "Node id is required"),
  type: architectureNodeTypeSchema,
  label: z.string().trim().min(1, "Label is required"),
  description: z.string().trim().optional().or(z.literal("")),
  icon: z.string().trim().optional().or(z.literal("")),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
})

export type ArchitectureGraphNode = z.infer<typeof architectureGraphNodeSchema>

export const architectureGraphEdgeSchema = z.object({
  id: z.string().trim().min(1, "Edge id is required"),
  source: z.string().trim().min(1, "Source is required"),
  target: z.string().trim().min(1, "Target is required"),
  label: z.string().trim().optional().or(z.literal("")),
  animated: z.boolean().optional(),
})

export type ArchitectureGraphEdge = z.infer<typeof architectureGraphEdgeSchema>

export type ArchitectureGraph = {
  nodes: ArchitectureGraphNode[]
  edges: ArchitectureGraphEdge[]
}

export function parseArchitectureGraphNodes(value: unknown): ArchitectureGraphNode[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = architectureGraphNodeSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseArchitectureGraphEdges(value: unknown): ArchitectureGraphEdge[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const parsed = architectureGraphEdgeSchema.safeParse(entry)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseArchitectureGraph(
  nodesValue: unknown,
  edgesValue: unknown
): ArchitectureGraph {
  return {
    nodes: parseArchitectureGraphNodes(nodesValue),
    edges: parseArchitectureGraphEdges(edgesValue),
  }
}

export function hasArchitectureGraph(graph: ArchitectureGraph): boolean {
  return graph.nodes.length > 0
}

export function createGraphNodeId(): string {
  return `node-${crypto.randomUUID().slice(0, 8)}`
}

export function createGraphEdgeId(): string {
  return `edge-${crypto.randomUUID().slice(0, 8)}`
}

export function defaultNodePosition(index: number): { x: number; y: number } {
  const column = index % 3
  const row = Math.floor(index / 3)
  return { x: column * 260, y: row * 140 }
}
