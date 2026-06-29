import type { ArchitectureNodeType } from "@/features/diagrams/lib/architecture-graph.schema"

export const ARCHITECTURE_NODE_TYPE_CONFIG: Record<
  ArchitectureNodeType,
  { label: string; defaultIcon: string; description: string }
> = {
  user: {
    label: "User",
    defaultIcon: "User",
    description: "Analyst, researcher, customer, or operator",
  },
  agent: {
    label: "Agent",
    defaultIcon: "Bot",
    description: "Research, validation, writer, or planner agent",
  },
  llm: {
    label: "LLM",
    defaultIcon: "Sparkles",
    description: "GPT, Claude, Gemini, or other model",
  },
  database: {
    label: "Database",
    defaultIcon: "Database",
    description: "PostgreSQL, vector store, Redis",
  },
  service: {
    label: "Service",
    defaultIcon: "Server",
    description: "FastAPI, API gateway, orchestrator",
  },
  tool: {
    label: "Tool",
    defaultIcon: "Wrench",
    description: "Search, retrieval, external APIs",
  },
  queue: {
    label: "Queue",
    defaultIcon: "Workflow",
    description: "Kafka, RabbitMQ, event streams",
  },
}

export const ARCHITECTURE_NODE_TYPE_OPTIONS = (
  Object.entries(ARCHITECTURE_NODE_TYPE_CONFIG) as [
    ArchitectureNodeType,
    (typeof ARCHITECTURE_NODE_TYPE_CONFIG)[ArchitectureNodeType],
  ][]
).map(([value, config]) => ({
  value,
  label: config.label,
}))

export function defaultIconForNodeType(type: ArchitectureNodeType): string {
  return ARCHITECTURE_NODE_TYPE_CONFIG[type].defaultIcon
}
